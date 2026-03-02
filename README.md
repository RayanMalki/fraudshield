# FraudShield

> A real-time credit card fraud detection platform built on a cloud-native microservices architecture. Transactions are scored by a machine learning model, persisted via an event-driven AWS pipeline, and surfaced through a modern web interface.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Flow](#data-flow)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Verifying the System](#verifying-the-system)
- [API Reference](#api-reference)

---

## Architecture Overview

FraudShield is composed of six containerised services and a LocalStack instance that emulates the AWS cloud locally. All containers run on a shared Docker bridge network (`fraudshield-network`).

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Browser                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP  :3000
                        ┌───────▼────────┐
                        │    Frontend    │  Next.js 15 / React 19
                        └───────┬────────┘
                                │ HTTP  :8080
                        ┌───────▼────────┐
                        │  API Gateway   │  Spring Cloud Gateway
                        │   JWT filter   │
                        └──┬────┬────┬───┘
                           │    │    │
              ┌────────────┘    │    └────────────┐
              │ /api/auth       │ /api/            │ /api/results
     ┌────────▼───────┐  /transactions   ┌────────▼────────┐
     │  User Service  │  ┌───────────┐   │ Results Service │
     │  Spring Boot   │  │Ingestion  │   │  Spring Boot    │
     │  PostgreSQL    │  │ Service   │   │  DynamoDB SDK   │
     └────────────────┘  │Spring Boot│   └────────┬────────┘
                         └─────┬─────┘            │ scan / getItem
                               │ gRPC :50051      │
                        ┌──────▼──────┐           │
                        │ ML Service  │    ┌───────▼────────────────┐
                        │  FastAPI    │    │       LocalStack        │
                        │  XGBoost   │    │  S3  · SQS · SNS       │
                        │ ← S3 model │    │  Lambda · DynamoDB     │
                        └──────┬──────┘   └───────────────────────┬─┘
                               │ SQS publish                      │
                               └──────────────────────────────────┘
                                         SQS trigger → Lambda
                                         Lambda → DynamoDB (write)
                                         Lambda → SNS (fraud alert)
```

---

## Data Flow

### Transaction Analysis
1. The user submits a transaction through the **Frontend**.
2. The request reaches the **API Gateway**, which validates the JWT and forwards it to the **Ingestion Service**.
3. The Ingestion Service calls the **ML Service** via **gRPC** to get a real-time fraud prediction.
4. The prediction result (transaction ID, amount, fraud flag, confidence score) is published as a JSON message to the **SQS** `fraud-results` queue.
5. **Lambda** (`fraud-processor`) is triggered by the SQS event source mapping, writes the result to **DynamoDB**, and — if the transaction is flagged as fraudulent — publishes an alert to the **SNS** `fraud-alerts` topic.

### History / Results
6. The Frontend requests the history page, which hits `GET /api/results` via the API Gateway.
7. The **Results Service** performs a DynamoDB `scan` and returns all stored results.

### Model Lifecycle
- On startup, the **ML Service** downloads `fraud_model.pkl` from the **S3** `fraudshield-models` bucket.
- The **LocalStack init script** (`localstack-init/ready.d/init.sh`) automatically creates all AWS resources and deploys the Lambda function when LocalStack becomes healthy.

---

## Services

| Service | Port | Technology | Responsibility |
|---|---|---|---|
| **API Gateway** | `8080` | Spring Cloud Gateway, Java 21 | JWT validation, request routing |
| **User Service** | `8081` | Spring Boot 4, PostgreSQL | Registration, login, JWT issuance |
| **Ingestion Service** | `8082` | Spring Boot 4, gRPC | Transaction intake, ML inference via gRPC, SQS publishing |
| **Results Service** | `8083` | Spring Boot 4, DynamoDB SDK v2 | Reads fraud results from DynamoDB |
| **ML Service** | `50051` (gRPC) | Python 3, FastAPI, XGBoost | Downloads model from S3, serves predictions over gRPC and HTTP |
| **Frontend** | `3000` | Next.js 15, React 19, Tailwind CSS | Authentication, transaction form, results history |
| **LocalStack** | `4566` | LocalStack Pro | Local AWS emulation (S3, SQS, SNS, Lambda, DynamoDB) |

---

## Tech Stack

**Backend**
- Java 21, Spring Boot 4.0
- Spring Cloud Gateway (WebMVC), Spring Security, Spring Data JPA
- AWS SDK for Java v2 (DynamoDB)
- Protocol Buffers / gRPC

**Machine Learning**
- Python 3, FastAPI, Uvicorn
- XGBoost, scikit-learn, pandas, joblib
- Model trained on the [PaySim synthetic dataset](https://www.kaggle.com/datasets/ealaxi/paysim1)

**Frontend**
- Next.js 15, React 19, TypeScript
- Tailwind CSS 3, lucide-react

**AWS Services** (emulated locally via LocalStack)
- **S3** — model artifact storage
- **SQS** — decoupled async messaging between ingestion and processing
- **Lambda** — event-driven result processor (Python 3.12, boto3)
- **SNS** — real-time fraud alert notifications
- **DynamoDB** — fraud result persistence (shared between Lambda and Results Service)

**Infrastructure**
- Docker, Docker Compose
- LocalStack Pro (AWS emulation)

---

## Project Structure

```
fraudshield/
├── api-gateway/                  # Spring Cloud Gateway — JWT filter & routing
├── user-service/                 # Auth service — registration, login, JWT
├── ingestion-service/            # Transaction intake, gRPC client, SQS publisher
│   └── src/main/proto/           # fraud_detection.proto (shared with ml-service)
├── results-service/              # DynamoDB reader — exposes GET /api/results
├── ml-service/                   # Python FastAPI — gRPC server + HTTP /predict
│   ├── main.py                   # App entrypoint, S3 model download, lifespan
│   ├── grpc_server.py            # FraudDetectionService gRPC implementation
│   ├── fraud_detection.proto     # gRPC contract
│   └── model/                    # Local model cache (gitignored; downloaded from S3)
├── frontend/                     # Next.js web application
│   └── app/
│       ├── page.tsx              # Auth page (login / register)
│       ├── transactions/         # Transaction analysis form
│       └── history/              # Fraud results table
├── lambda/
│   └── fraud_handler.py          # Lambda: SQS → DynamoDB + SNS
├── localstack-init/
│   └── ready.d/init.sh           # Auto-runs on LocalStack healthy: creates all AWS resources
├── .env                          # Secret environment variables (not committed)
└── docker-compose.yml            # Full-stack orchestration
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with the Docker socket accessible — required for LocalStack Lambda)
- A [LocalStack Pro auth token](https://app.localstack.cloud/) (free tier available; Lambda requires Pro)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/fraudshield.git
cd fraudshield
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```bash
cp .env.example .env
```

Then fill in the required values:

```env
# PostgreSQL password for the user-service database
DB_PASSWORD=your_postgres_password

# Secret used to sign and verify JWTs (use a long random string)
JWT_SECRET=your_jwt_secret_key

# LocalStack Pro auth token — required for Lambda support
LOCALSTACK_AUTH_TOKEN=your_localstack_token
```

### 3. Build and start all services

```bash
docker compose up --build
```

This single command:
- Starts PostgreSQL for the user service
- Starts LocalStack and waits for it to become healthy
- Runs the init script, which automatically creates the SQS queue, S3 bucket, DynamoDB table, SNS topic, and deploys the Lambda function with its SQS trigger
- Builds and starts all five application services and the frontend

> **First run note:** The initial build takes several minutes as Maven dependencies and Python packages are downloaded. Subsequent starts are significantly faster.

### 4. Open the application

Navigate to [http://localhost:3000](http://localhost:3000) and create an account to get started.

---

## Verifying the System

After `docker compose up --build` completes, you can verify each layer of the stack:

**Check LocalStack resources were created**
```bash
# SQS queue
aws --endpoint-url=http://localhost:4566 sqs list-queues

# S3 model artifact
aws --endpoint-url=http://localhost:4566 s3 ls s3://fraudshield-models/

# DynamoDB table
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Lambda function with SQS trigger
aws --endpoint-url=http://localhost:4566 lambda list-event-source-mappings
```

**Submit a transaction and check DynamoDB**
```bash
# 1. Register and get a token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret"}' \
  | jq -r '.token')

# 2. Submit a high-risk transaction
curl -X POST http://localhost:8080/api/transactions/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "step": 1,
    "type": "TRANSFER",
    "amount": 9000,
    "oldbalanceOrg": 9000,
    "newbalanceOrig": 0,
    "oldbalanceDest": 0,
    "newbalanceDest": 9000
  }'

# 3. Verify the result was written to DynamoDB (allow ~2s for Lambda to process)
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name fraud-results

# 4. Fetch results via the API
curl http://localhost:8080/api/results -H "Authorization: Bearer $TOKEN"
```

---

## API Reference

All routes go through the API Gateway on port `8080`. Endpoints marked with `Auth` require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` | Create an account, returns `{ token, userId, email }` |
| `POST` | `/api/auth/login` | `{ email, password }` | Sign in, returns `{ token, userId, email }` |

### Transactions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/transactions/predict` | Yes | Submit a transaction for fraud scoring |

**Request body:**
```json
{
  "step": 1,
  "type": "TRANSFER",
  "amount": 9000.00,
  "oldbalanceOrg": 9000.00,
  "newbalanceOrig": 0.00,
  "oldbalanceDest": 0.00,
  "newbalanceDest": 9000.00
}
```

`type` must be one of: `TRANSFER`, `CASH_OUT`, `PAYMENT`, `CASH_IN`, `DEBIT`

### Results

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/results` | Yes | List all fraud prediction results |
| `GET` | `/api/results/{transactionId}` | Yes | Get result by transaction ID |
