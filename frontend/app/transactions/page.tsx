"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, RotateCcw, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  analyzeTransaction,
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
  amount: string;
  oldbalanceOrg: string;
  oldbalanceDest: string;
}

const DEFAULTS: FormValues = {
  type: "TRANSFER",
  amount: "",
  oldbalanceOrg: "",
  oldbalanceDest: "",
};

const EXAMPLE_FRAUD: FormValues = {
  type: "TRANSFER",
  amount: "9000",
  oldbalanceOrg: "9000",
  oldbalanceDest: "0",
};

type VisibleKey = "amount" | "oldbalanceOrg" | "oldbalanceDest";

interface FieldConfig {
  key: VisibleKey;
  label: string;
  hint: string;
}

function getFields(type: TransactionType): FieldConfig[] {
  switch (type) {
    case "TRANSFER":
      return [
        { key: "amount", label: "Amount (USD)", hint: "Amount to transfer" },
        { key: "oldbalanceOrg", label: "Origin balance", hint: "Sender's account balance before transfer" },
        { key: "oldbalanceDest", label: "Dest. balance", hint: "Recipient's account balance before transfer" },
      ];
    case "CASH_OUT":
      return [
        { key: "amount", label: "Amount (USD)", hint: "Amount to withdraw" },
        { key: "oldbalanceOrg", label: "Account balance", hint: "Your account balance before withdrawal" },
      ];
    case "CASH_IN":
      return [
        { key: "amount", label: "Amount (USD)", hint: "Amount to deposit" },
        { key: "oldbalanceDest", label: "Account balance", hint: "Your account balance before deposit" },
      ];
    case "DEBIT":
    case "PAYMENT":
      return [
        { key: "amount", label: "Amount (USD)", hint: "Transaction amount" },
        { key: "oldbalanceOrg", label: "Account balance", hint: "Your account balance before transaction" },
      ];
  }
}

function buildTransaction(form: FormValues): TransactionInput {
  const amount = parseFloat(form.amount);
  const oldOrg = parseFloat(form.oldbalanceOrg || "0");
  const oldDest = parseFloat(form.oldbalanceDest || "0");

  switch (form.type) {
    case "TRANSFER":
      return { type: form.type, step: 1, amount, oldbalanceOrg: oldOrg, newbalanceOrig: Math.max(0, oldOrg - amount), oldbalanceDest: oldDest, newbalanceDest: oldDest + amount };
    case "CASH_OUT":
      return { type: form.type, step: 1, amount, oldbalanceOrg: oldOrg, newbalanceOrig: Math.max(0, oldOrg - amount), oldbalanceDest: 0, newbalanceDest: amount };
    case "CASH_IN":
      return { type: form.type, step: 1, amount, oldbalanceOrg: amount, newbalanceOrig: 0, oldbalanceDest: oldDest, newbalanceDest: oldDest + amount };
    case "DEBIT":
    case "PAYMENT":
      return { type: form.type, step: 1, amount, oldbalanceOrg: oldOrg, newbalanceOrig: Math.max(0, oldOrg - amount), oldbalanceDest: 0, newbalanceDest: 0 };
  }
}

export default function TransactionsPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormValues>(DEFAULTS);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [lastTx, setLastTx] = useState<TransactionInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  function setField(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function changeType(type: TransactionType) {
    setForm({ ...DEFAULTS, type });
    setError(null);
  }

  function reset() {
    setForm(DEFAULTS);
    setResult(null);
    setLastTx(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('"Amount" must be a positive number');

      const fields = getFields(form.type);
      for (const { key, label } of fields) {
        if (key === "amount") continue;
        if (isNaN(parseFloat(form[key]))) throw new Error(`"${label}" must be a valid number`);
      }

      const tx = buildTransaction(form);
      const prediction = await analyzeTransaction(tx, token!);
      setResult(prediction);
      setLastTx(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  const visibleFields = getFields(form.type);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Transaction Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit a transaction to the XGBoost model for real-time fraud scoring.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 w-full">
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
                onChange={(e) => changeType(e.target.value as TransactionType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} — {TYPE_DESCRIPTIONS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic fields */}
            <div className="grid grid-cols-2 gap-3">
              {visibleFields.map(({ key, label, hint }) => (
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
