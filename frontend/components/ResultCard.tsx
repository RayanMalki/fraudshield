"use client";

import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { PredictionResult, TransactionInput } from "@/lib/api";

interface Props {
  result: PredictionResult;
  transaction: TransactionInput;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function ResultCard({ result, transaction }: Props) {
  const isFraud = result.is_fraud;
  const pct = Math.round(result.confidence * 100);

  // Risk level
  const riskLabel =
    result.confidence >= 0.85
      ? "CRITICAL"
      : result.confidence >= 0.6
      ? "HIGH"
      : result.confidence >= 0.35
      ? "MEDIUM"
      : "LOW";

  const riskColor = {
    CRITICAL: "text-red-400",
    HIGH: "text-orange-400",
    MEDIUM: "text-amber-400",
    LOW: "text-emerald-400",
  }[riskLabel];

  // Theme colours driven by verdict
  const theme = isFraud
    ? {
        bg: "bg-red-950/30",
        border: "border-red-800/50",
        glow: "shadow-red-900/30",
        badgeBg: "bg-red-600",
        badgeText: "text-white",
        barBg: "bg-red-500",
        barTrack: "bg-red-950",
        icon: AlertTriangle,
        iconColor: "text-red-400",
        label: "FRAUDULENT",
        sublabel: "Transaction flagged as suspicious",
      }
    : {
        bg: "bg-emerald-950/30",
        border: "border-emerald-800/50",
        glow: "shadow-emerald-900/30",
        badgeBg: "bg-emerald-600",
        badgeText: "text-white",
        barBg: "bg-emerald-500",
        barTrack: "bg-emerald-950",
        icon: CheckCircle2,
        iconColor: "text-emerald-400",
        label: "LEGITIMATE",
        sublabel: "Transaction appears normal",
      };

  const Icon = theme.icon;

  const rows = [
    { label: "Type", value: transaction.type },
    { label: "Amount", value: fmt(transaction.amount) },
    { label: "Origin balance (before)", value: fmt(transaction.oldbalanceOrg) },
    { label: "Origin balance (after)", value: fmt(transaction.newbalanceOrig) },
    { label: "Dest. balance (before)", value: fmt(transaction.oldbalanceDest) },
    { label: "Dest. balance (after)", value: fmt(transaction.newbalanceDest) },
    { label: "Step", value: transaction.step.toString() },
  ];

  return (
    <div
      className={`animate-fade-up rounded-2xl border p-6 shadow-xl ${theme.bg} ${theme.border} ${theme.glow}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${isFraud ? "bg-red-900/50" : "bg-emerald-900/50"}`}>
            <Icon className={`h-5 w-5 ${theme.iconColor}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
              Verdict
            </p>
            <h2 className="text-xl font-bold text-white leading-tight">
              {theme.label}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{theme.sublabel}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${riskColor} bg-gray-800`}
        >
          {riskLabel} RISK
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <TrendingUp className="h-3.5 w-3.5" />
            Fraud probability
          </span>
          <span className={`text-sm font-bold ${isFraud ? "text-red-400" : "text-emerald-400"}`}>
            {pct}%
          </span>
        </div>

        <div className={`h-2.5 rounded-full ${theme.barTrack} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${theme.barBg} transition-all duration-700 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">0%</span>
          <span className="text-xs text-gray-600">50%</span>
          <span className="text-xs text-gray-600">100%</span>
        </div>
      </div>

      {/* Divider */}
      <div className={`border-t ${theme.border} mb-5`} />

      {/* Transaction details */}
      <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-3">
        Transaction details
      </p>
      <dl className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-xs font-mono font-medium text-gray-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
