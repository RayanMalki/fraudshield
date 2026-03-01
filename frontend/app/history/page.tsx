"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldOff,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getResults, ResultResponse } from "@/lib/api";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function FraudBadge({ fraudulent, score }: { fraudulent: boolean; score: number }) {
  return fraudulent ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-950 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-800/40">
      <AlertTriangle className="h-3 w-3" />
      FRAUD
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/40">
      <CheckCircle2 className="h-3 w-3" />
      LEGIT
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-gray-800">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-full max-w-[100px] animate-pulse rounded bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

type SortKey = "createdAt" | "amount" | "confidenceScore";
type SortDir = "asc" | "desc";

export default function HistoryPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [results, setResults] = useState<ResultResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "fraud" | "legit">("all");

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  const fetchResults = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getResults(token);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) fetchResults();
  }, [isAuthenticated, fetchResults]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...results]
    .filter((r) =>
      filter === "all" ? true : filter === "fraud" ? r.fraudulent : !r.fraudulent
    )
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp =
        typeof aVal === "string"
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const stats = {
    total: results.length,
    fraud: results.filter((r) => r.fraudulent).length,
    legit: results.filter((r) => !r.fraudulent).length,
    rate: results.length
      ? ((results.filter((r) => r.fraudulent).length / results.length) * 100).toFixed(1)
      : "0.0",
  };

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Detection History</h1>
          <p className="mt-1 text-sm text-gray-500">
            All transactions analyzed by FraudShield
          </p>
        </div>
        <button
          onClick={fetchResults}
          disabled={loading}
          className="flex items-center gap-2 self-start rounded-lg border border-gray-700 px-3.5 py-2 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Fraudulent", value: stats.fraud, color: "text-red-400" },
          { label: "Legitimate", value: stats.legit, color: "text-emerald-400" },
          { label: "Fraud rate", value: `${stats.rate}%`, color: stats.fraud > 0 ? "text-amber-400" : "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 w-fit rounded-lg bg-gray-800/50 p-1">
        {(["all", "fraud", "legit"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f === "all" ? "All" : f === "fraud" ? "Fraud only" : "Legit only"}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                  >
                    Date / Time
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <button
                    onClick={() => toggleSort("amount")}
                    className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                  >
                    Amount
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Verdict
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <button
                    onClick={() => toggleSort("confidenceScore")}
                    className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                  >
                    Confidence
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      {results.length === 0 ? (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800/60">
                            <History className="h-5 w-5 text-gray-600" />
                          </div>
                          <p className="text-sm text-gray-500">No results yet</p>
                          <p className="text-xs text-gray-600">
                            Analyze a transaction to see it here
                          </p>
                        </>
                      ) : (
                        <>
                          <ShieldOff className="h-8 w-8 text-gray-700" />
                          <p className="text-sm text-gray-500">
                            No results match this filter
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-gray-800 transition-colors hover:bg-gray-800/30 ${
                      i % 2 === 0 ? "" : "bg-gray-900/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {r.createdAt ? fmtDate(r.createdAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs font-mono font-medium text-gray-300">
                        {r.merchant || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white tabular-nums">
                      {r.amount !== null && r.amount !== undefined ? fmt(r.amount) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <FraudBadge
                        fraudulent={r.fraudulent}
                        score={r.confidenceScore}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className={`h-full rounded-full ${
                              r.fraudulent ? "bg-red-500" : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.round(r.confidenceScore * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-400">
                          {Math.round(r.confidenceScore * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && sorted.length > 0 && (
          <div className="border-t border-gray-800 px-4 py-2.5">
            <p className="text-xs text-gray-600">
              Showing {sorted.length} of {results.length} records
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
