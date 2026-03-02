package com.examplecom.fraudshield.ingestion_service.service;

import com.examplecom.fraudshield.ingestion_service.dto.PaySimRequest;
import com.examplecom.fraudshield.ingestion_service.dto.PredictionResult;
import com.examplecom.fraudshield.ingestion_service.dto.TransactionRequest;
import com.examplecom.fraudshield.ingestion_service.dto.TransactionResponse;
import com.examplecom.fraudshield.ingestion_service.grpc.MLServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final MLServiceClient mlServiceClient;
    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;

    @Value("${ml.service.http-url:http://ml-service:8000}")
    private String mlHttpUrl;

    @Value("${sqs.queue-url:http://localstack:4566/000000000000/fraud-results}")
    private String sqsQueueUrl;

    public TransactionResponse analyze(TransactionRequest request) {
        try {
            return mlServiceClient.predict(request);
        } catch (Exception e) {
            return new TransactionResponse(request.getTransactionId(), false, 0.0, "PENDING");
        }
    }

    public PredictionResult predictPaySim(PaySimRequest request) {
        RestClient restClient = RestClient.create();

        PredictionResult prediction = restClient.post()
                .uri(mlHttpUrl + "/predict")
                .header("Content-Type", "application/json")
                .body(request)
                .retrieve()
                .body(PredictionResult.class);

        try {
            Map<String, Object> resultPayload = new HashMap<>();
            resultPayload.put("transactionId", UUID.randomUUID().toString());
            resultPayload.put("cardNumber", "DIRECT");
            resultPayload.put("amount", request.getAmount());
            resultPayload.put("merchant", request.getType().toString());
            resultPayload.put("location", "FraudShield Analysis");
            resultPayload.put("fraudulent", prediction.isFraud());
            resultPayload.put("confidenceScore", prediction.getConfidence());

            String messageBody = objectMapper.writeValueAsString(resultPayload);

            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(sqsQueueUrl)
                    .messageBody(messageBody)
                    .build());
        } catch (Exception e) {
            // Non-blocking: log and continue even if SQS publish fails
            System.err.println("Failed to publish to SQS: " + e.getMessage());
        }

        return prediction;
    }
}
