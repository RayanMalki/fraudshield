import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Literal

import boto3
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODEL_PATH = Path(__file__).parent / "model" / "fraud_model.pkl"

MODEL_S3_BUCKET = os.environ.get("MODEL_S3_BUCKET", "fraudshield-models")
MODEL_S3_KEY = os.environ.get("MODEL_S3_KEY", "fraud_model.pkl")
AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL", "")
FRAUD_THRESHOLD_ENV = os.environ.get("FRAUD_THRESHOLD", "0.99")


def _load_fraud_threshold(raw_threshold: str) -> float:
    try:
        threshold = float(raw_threshold)
    except ValueError as e:
        raise ValueError(f"Invalid FRAUD_THRESHOLD '{raw_threshold}': expected a float.") from e

    if threshold < 0.0 or threshold > 1.0:
        raise ValueError(
            f"Invalid FRAUD_THRESHOLD '{raw_threshold}': expected a value between 0 and 1."
        )

    return threshold


FRAUD_THRESHOLD = _load_fraud_threshold(FRAUD_THRESHOLD_ENV)


def _download_model_from_s3(retries: int = 10, delay: int = 10) -> None:
    """Download the model artifact from S3, retrying until the init script has uploaded it."""
    import time
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    kwargs = dict(region_name="us-east-1")
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    aws_key = os.environ.get("AWS_ACCESS_KEY_ID", "test")
    aws_secret = os.environ.get("AWS_SECRET_ACCESS_KEY", "test")
    s3 = boto3.client("s3", aws_access_key_id=aws_key, aws_secret_access_key=aws_secret, **kwargs)
    for attempt in range(1, retries + 1):
        try:
            print(f"Downloading model from s3://{MODEL_S3_BUCKET}/{MODEL_S3_KEY} (attempt {attempt}/{retries}) ...")
            s3.download_file(MODEL_S3_BUCKET, MODEL_S3_KEY, str(MODEL_PATH))
            print("Model downloaded successfully.")
            return
        except Exception as e:
            print(f"Model not available yet ({e}). Retrying in {delay}s ...")
            time.sleep(delay)
    raise RuntimeError(f"Failed to download model from S3 after {retries} attempts.")

# Columns produced by pd.get_dummies(df, columns=["type"]) during training,
# in the order the model expects them.
FEATURE_COLUMNS = [
    "step",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "type_CASH_IN",
    "type_CASH_OUT",
    "type_DEBIT",
    "type_PAYMENT",
    "type_TRANSFER",
]

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    _download_model_from_s3()
    model = joblib.load(MODEL_PATH)

    from grpc_server import serve as grpc_serve
    print(f"Loaded fraud decision threshold: {FRAUD_THRESHOLD}")
    grpc_server = grpc_serve(model, FRAUD_THRESHOLD)

    yield

    grpc_server.stop(grace=0)


app = FastAPI(lifespan=lifespan)

# Allow the Next.js frontend (localhost:3000 or any Vercel deployment) to call /predict
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten to specific origins in production
    allow_methods=["*"],
    allow_headers=["*"],
)


class Transaction(BaseModel):
    step: int
    amount: float
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    type: Literal["TRANSFER", "CASH_OUT", "PAYMENT", "CASH_IN", "DEBIT"]


class PredictionResponse(BaseModel):
    is_fraud: bool
    confidence: float


@app.post("/predict", response_model=PredictionResponse)
def predict(transaction: Transaction):
    df = pd.DataFrame([transaction.model_dump()])

    df = pd.get_dummies(df, columns=["type"])

    # Align to training columns — fills any missing type_* dummies with 0
    df = df.reindex(columns=FEATURE_COLUMNS, fill_value=0)

    proba = model.predict_proba(df)[0]
    fraud_proba = float(proba[1])

    return PredictionResponse(
        is_fraud=fraud_proba >= FRAUD_THRESHOLD,
        confidence=fraud_proba,
    )
