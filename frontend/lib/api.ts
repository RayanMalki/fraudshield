// ── Environment ────────────────────────────────────────────────────────────
const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";
const ML = process.env.NEXT_PUBLIC_ML_URL ?? "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────

export type TransactionType =
  | "TRANSFER"
  | "CASH_OUT"
  | "PAYMENT"
  | "CASH_IN"
  | "DEBIT";

export interface TransactionInput {
  step: number;
  amount: number;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
  type: TransactionType;
}

export interface PredictionResult {
  is_fraud: boolean;
  confidence: number; // fraud probability 0–1
}

export interface ResultRequest {
  transactionId: string;
  cardNumber: string;
  amount: number;
  merchant: string;
  location: string;
  fraudulent: boolean;
  confidenceScore: number;
}

export interface ResultResponse {
  id: string;
  transactionId: string;
  cardNumber: string;
  amount: number;
  merchant: string;  // we store transaction type here
  location: string;
  fraudulent: boolean;
  confidenceScore: number;
  createdAt: string; // ISO datetime from Spring LocalDateTime
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    // Try to extract a meaningful message from the response body
    const body = await res.text().catch(() => "");
    let message = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(body);
      message = json.message ?? json.error ?? message;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export function authLogin(email: string, password: string) {
  return request<AuthResponse>(`${GATEWAY}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function authRegister(name: string, email: string, password: string) {
  return request<AuthResponse>(`${GATEWAY}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// ── ML Service ─────────────────────────────────────────────────────────────

export function predictFraud(data: TransactionInput) {
  return request<PredictionResult>(`${ML}/predict`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Results Service ────────────────────────────────────────────────────────

export function saveResult(payload: ResultRequest, token: string) {
  return request<ResultResponse>(`${GATEWAY}/api/results`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getResults(token: string) {
  return request<ResultResponse[]>(`${GATEWAY}/api/results`, {
    headers: authHeaders(token),
  });
}
