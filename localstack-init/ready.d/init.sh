#!/bin/bash
set -e

AWS="aws --endpoint-url=http://localhost:4566 --region us-east-1"

echo "=== [1/6] Creating SQS queue: fraud-results ==="
$AWS sqs create-queue --queue-name fraud-results
QUEUE_URL=$($AWS sqs get-queue-url --queue-name fraud-results --query QueueUrl --output text)
QUEUE_ARN=$($AWS sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-names QueueArn \
  --query Attributes.QueueArn --output text)
echo "Queue ARN: $QUEUE_ARN"

echo "=== [2/6] Creating S3 bucket and uploading model ==="
$AWS s3 mb s3://fraudshield-models
if [ -f /models/fraud_model.pkl ]; then
  $AWS s3 cp /models/fraud_model.pkl s3://fraudshield-models/fraud_model.pkl
  echo "Model uploaded to s3://fraudshield-models/fraud_model.pkl"
else
  echo "WARNING: /models/fraud_model.pkl not found — skipping upload"
fi

echo "=== [3/6] Creating DynamoDB table: fraud-results ==="
$AWS dynamodb create-table \
  --table-name fraud-results \
  --attribute-definitions AttributeName=transactionId,AttributeType=S \
  --key-schema AttributeName=transactionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

echo "=== [4/6] Creating SNS topic: fraud-alerts ==="
SNS_ARN=$($AWS sns create-topic --name fraud-alerts --query TopicArn --output text)
echo "SNS ARN: $SNS_ARN"

echo "=== [5/6] Deploying Lambda: fraud-processor ==="
cd /tmp
cp /lambda/fraud_handler.py .
zip fraud_handler.zip fraud_handler.py

$AWS lambda create-function \
  --function-name fraud-processor \
  --runtime python3.12 \
  --handler fraud_handler.handler \
  --zip-file fileb://fraud_handler.zip \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --environment "Variables={DYNAMODB_TABLE=fraud-results,SNS_TOPIC_ARN=$SNS_ARN,AWS_ENDPOINT_URL=http://localstack:4566}"

echo "Waiting for Lambda to become active..."
$AWS lambda wait function-active --function-name fraud-processor

echo "=== [6/6] Creating SQS event source mapping ==="
$AWS lambda create-event-source-mapping \
  --function-name fraud-processor \
  --event-source-arn "$QUEUE_ARN" \
  --batch-size 10

echo "=== LocalStack init complete ==="
