import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib
from sklearn.metrics import f1_score, precision_score, recall_score

df = pd.read_csv("/content/drive/MyDrive/transactions.csv")
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
    "n_jobs": -1,
    "tree_method": "hist",
    "device": "cuda",
}

print("training started...")
model = xgb.XGBClassifier(**params)

model.fit(X_train, y_train, verbose=True)

y_pred = (model.predict_proba(X_test)[:, 1] > 0.99).astype(int)

print(classification_report(y_test, y_pred))
print("ROC AUC:  ", roc_auc_score(y_test, y_pred))
print("F1 Score: ", f1_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall:   ", recall_score(y_test, y_pred))

joblib.dump(model, "/content/drive/MyDrive/fraud_model.pkl")

print("training done!")
