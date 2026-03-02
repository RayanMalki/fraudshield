import json
import os

import boto3

AWS_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL", "http://localstack:4566")
TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "fraud-results")
SNS_ARN = os.environ.get("SNS_TOPIC_ARN", "")

boto_kwargs = dict(
    endpoint_url=AWS_ENDPOINT,
    region_name="us-east-1",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)
ddb = boto3.resource("dynamodb", **boto_kwargs)
sns = boto3.client("sns", **boto_kwargs)
table = ddb.Table(TABLE_NAME)


def handler(event, context):
    for record in event.get("Records", []):
        body = json.loads(record["body"])

        table.put_item(Item={
            "transactionId": body.get("transactionId", ""),
            "cardNumber": body.get("cardNumber", ""),
            "amount": str(body.get("amount", 0)),
            "merchant": body.get("merchant", ""),
            "location": body.get("location", ""),
            "fraudulent": body.get("fraudulent", False),
            "confidenceScore": str(body.get("confidenceScore", 0)),
        })

        if body.get("fraudulent"):
            sns.publish(
                TopicArn=SNS_ARN,
                Subject=f"Fraud Alert: {body.get('transactionId')}",
                Message=json.dumps(body),
            )

    return {"statusCode": 200}
