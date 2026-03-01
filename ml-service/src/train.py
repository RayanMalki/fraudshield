import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib


df = pd.read_csv("../data/transactions.csv")
print(f"Dataset loaded: {len(df)} rows")

df = df.drop(columns=["nameOrig", "nameDest", "isFlaggedFraud"])

df = pd.get_dummies(df, columns=["type"])

y = df["isFraud"]
X = df.drop(columns=["isFraud"])
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
scale_pos_weight = (y == 0).sum() / (y == 1).sum()

params = {
    "scale_pos_weight": scale_pos_weight,
    "n_estimators": 100,
    "max_depth": 6,
    "learning_rate": 0.1,
    "verbosity": 1,
}

print("traning started...")
model = xgb.XGBClassifier(**params)

model.fit(X_train, y_train, verbose=True)

y_pred = model.predict(X_test)

print(classification_report(y_test, y_pred))
print(roc_auc_score(y_test, y_pred))

joblib.dump(model, "../model/fraud_model.pkl")

print("traning done !")
