"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, RotateCcw, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  predictFraud,
  saveResult,
  TransactionInput,
  PredictionResult,
  TransactionType,
} from "@/lib/api";
import ResultCard from "@/components/ResultCard";

const TYPES: TransactionType[] = [
  "TRANSFER",
  "CASH_OUT",
  "PAYMENT",
  "CASH_IN",
  "DEBIT",
];

const TYPE_DESCRIPTIONS: Record<TransactionType, string> = {
  TRANSFER: "Move funds to another account",
  CASH_OUT: "Withdraw funds as cash",
  PAYMENT: "Pay for goods or services",
  CASH_IN: "Deposit cash into account",
  DEBIT: "Debit card transaction",
};

interface FormValues {
  type: TransactionType;
  step: string;
  amount: string;
  oldbalanceOrg: string;
  newbalanceOrig: string;
  oldbalanceDest: string;
  newbalanceDest: string;
}

const DEFAULTS: FormValues = {
  type: "TRANSFER",
  step: "1",
  amount: "",
  oldbalanceOrg: "",
  newbalanceOrig: "",
  oldbalanceDest: "",
  newbalanceDest: "",
};

// A prefilled example that the model should flag as fraud
const EXAMPLE_FRAUD: FormValues = {
  type: "TRANSFER",
  step: "1",
  amount: "9000",
  oldbalanceOrg: "9000",
  newbalanceOrig: "0",
  oldbalanceDest: "0",
  newbalanceDest: "9000",
};

interface Field {
  key: keyof FormValues;
  label: string;
  hint: string;
  type: "number" | "text";
}

const NUMERIC_FIELDS: Field[] = [
  { key: "step", label: "Step", hint: "Simulation step (integer)", type: "number" },
  { key: "amount", label: "Amount (USD)", hint: "Transaction amount", type: "number" },
  { key: "oldbalanceOrg", label: "Origin balance before", hint: "Sender balance before transaction", type: "number" },
  { key: "newbalanceOrig", label: "Origin balance after", hint: "Sender balance after transaction", type: "number" },
  { key: "oldbalanceDest", label: "Dest. balance before", hint: "Receiver balance before transaction", type: "number" },
  { key: "newbalanceDest", label: "Dest. balance after", hint: "Receiver balance after transaction", type: "number" },
];

export default function TransactionsPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormValues>(DEFAULTS);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [lastTx, setLastTx] = useState<TransactionInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  function setField(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function reset() {
    setForm(DEFAULTS);
    setResult(null);
    setLastTx(null);
    setError(null);
    setSavedOk(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedOk(null);

    try {
      const tx: TransactionInput = {
        type: form.type,
        step: parseInt(form.step, 10),
        amount: parseFloat(form.amount),
        oldbalanceOrg: parseFloat(form.oldbalanceOrg),
        newbalanceOrig: parseFloat(form.newbalanceOrig),
        oldbalanceDest: parseFloat(form.oldbalanceDest),
        newbalanceDest: parseFloat(form.newbalanceDest),
      };

      // Validate
      const nums: (keyof TransactionInput)[] = [
        "step", "amount", "oldbalanceOrg", "newbalanceOrig",
        "oldbalanceDest", "newbalanceDest",
      ];
      for (const k of nums) {
        if (isNaN(tx[k] as number)) {
          throw new Error(`"${k}" must be a valid number`);
        }
      }

      const prediction = await predictFraud(tx);
      setResult(prediction);
      setLastTx(tx);

      // Persist to results-service (best-effort, non-blocking)
      if (token) {
        saveResult(
          {
            transactionId: crypto.randomUUID(),
            cardNumber: "DIRECT",
            amount: tx.amount,
            merchant: tx.type,       // reuse merchant field for type
            location: "FraudShield Analysis",
            fraudulent: prediction.is_fraud,
            confidenceScore: prediction.confidence,
          },
          token
        )
          .then(() => setSavedOk(true))
          .catch(() => setSavedOk(false));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Transaction Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit a transaction to the XGBoost model for real-time fraud scoring.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Form Card ─────────────────────────────────────────────── */}
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Transaction details
            </h2>
            <button
              type="button"
              onClick={() => setForm(EXAMPLE_FRAUD)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Load example (fraud)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Transaction type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Transaction type
              </label>
              <select
                className="input appearance-none cursor-pointer"
                value={form.type}
                onChange={(e) => setField("type", e.target.value as TransactionType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} — {TYPE_DESCRIPTIONS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Numeric fields in a 2-column grid */}
            <div className="grid grid-cols-2 gap-3">
              {NUMERIC_FIELDS.map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-400">
                    {label}
                    <span title={hint} className="cursor-help">
                      <Info className="h-3 w-3 text-gray-600" />
                    </span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-lg border border-red-800/40 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Analyze transaction
                  </>
                )}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3.5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Save status indicator */}
          {savedOk !== null && (
            <p className={`mt-3 text-xs ${savedOk ? "text-emerald-500" : "text-yellow-600"}`}>
              {savedOk
                ? "✓ Result saved to history"
                : "⚠ Could not save to history (check results-service)"}
            </p>
          )}
        </div>

        {/* ── Result Panel ─────────────────────────────────────────── */}
        <div>
          {loading && (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-3 text-sm text-gray-500">
                  Running XGBoost inference…
                </p>
              </div>
            </div>
          )}

          {!loading && result && lastTx && (
            <ResultCard result={result} transaction={lastTx} />
          )}

          {!loading && !result && (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-800">
              <div className="text-center px-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800/60">
                  <Send className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">
                  Fill in the form and click{" "}
                  <span className="text-gray-300">Analyze transaction</span> to
                  see the ML verdict.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
