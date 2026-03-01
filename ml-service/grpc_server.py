"""gRPC server implementing FraudDetectionService on port 50051.

The gRPC contract (from fraud_detection.proto) uses payment-level fields
(transaction_id, card_number, amount, merchant, location), while the XGBoost
model was trained on PaySim dataset features. We map them conservatively:
- amount  → model amount (direct)
- type    → TRANSFER (worst-case; most fraud in PaySim is TRANSFER/CASH_OUT)
- balances → amount moved entirely out of origin, into dest

Stubs (fraud_detection_pb2*.py) are generated at image-build time by the
Dockerfile via grpc_tools.protoc.
"""
from concurrent import futures

import grpc
import pandas as pd

import fraud_detection_pb2
import fraud_detection_pb2_grpc

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


class FraudDetectionServicer(fraud_detection_pb2_grpc.FraudDetectionServiceServicer):
    def __init__(self, model):
        self._model = model

    def PredictFraud(self, request, context):
        df = pd.DataFrame(
            [
                {
                    "step": 1,
                    "amount": request.amount,
                    "oldbalanceOrg": request.amount,
                    "newbalanceOrig": 0.0,
                    "oldbalanceDest": 0.0,
                    "newbalanceDest": request.amount,
                    "type": "TRANSFER",
                }
            ]
        )
        df = pd.get_dummies(df, columns=["type"])
        df = df.reindex(columns=FEATURE_COLUMNS, fill_value=0)

        proba = self._model.predict_proba(df)[0]
        fraud_proba = float(proba[1])

        return fraud_detection_pb2.FraudResponse(
            transaction_id=request.transaction_id,
            fraudulent=fraud_proba >= 0.5,
            confidence_score=fraud_proba,
        )


def serve(model) -> grpc.Server:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    fraud_detection_pb2_grpc.add_FraudDetectionServiceServicer_to_server(
        FraudDetectionServicer(model), server
    )
    server.add_insecure_port("[::]:50051")
    server.start()
    return server
