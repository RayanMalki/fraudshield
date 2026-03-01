"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authLogin, authRegister } from "@/lib/api";

type Tab = "login" | "register";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push("/transactions");
  }, [isAuthenticated, router]);

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data =
        tab === "login"
          ? await authLogin(email, password)
          : await authRegister(name, email, password);
      login(data.token, data.email);
      router.push("/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-indigo-800/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Brand block */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40">
            <Shield className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">FraudShield</h1>
          <p className="mt-1 text-sm text-gray-500">
            ML-powered transaction security
          </p>
        </div>

        {/* Card */}
        <div className="card p-7">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-gray-800/50 p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-gray-700 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Full name
                </label>
                <input
                  className="input"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Email address
              </label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    tab === "login" ? "current-password" : "new-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-800/40 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tab === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : tab === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Feature list (register tab only) */}
          {tab === "register" && (
            <ul className="mt-5 space-y-1.5 border-t border-gray-800 pt-4">
              {[
                "Real-time XGBoost fraud scoring",
                "gRPC-backed microservices",
                "Persistent detection history",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="h-1 w-1 rounded-full bg-blue-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
