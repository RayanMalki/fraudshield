from pathlib import Path
from contextlib import asynccontextmanager
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODEL_PATH = Path(__file__).parent / "model" / "fraud_model.pkl"

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
    model = joblib.load(MODEL_PATH)

    from grpc_server import serve as grpc_serve
    grpc_server = grpc_serve(model)

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

    return PredictionResponse(is_fraud=fraud_proba >= 0.5, confidence=fraud_proba)
