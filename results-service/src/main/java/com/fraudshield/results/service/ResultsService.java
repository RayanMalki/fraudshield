package com.fraudshield.results.service;

import com.fraudshield.results.dto.ResultRequest;
import com.fraudshield.results.dto.ResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResultsService {

    private final DynamoDbClient dynamoDbClient;

    @Value("${aws.dynamodb.table:fraud-results}")
    private String tableName;

    public ResultResponse save(ResultRequest request) {
        Map<String, AttributeValue> item = Map.of(
                "transactionId", AttributeValue.fromS(orEmpty(request.getTransactionId())),
                "cardNumber",    AttributeValue.fromS(orEmpty(request.getCardNumber())),
                "amount",        AttributeValue.fromS(String.valueOf(request.getAmount())),
                "merchant",      AttributeValue.fromS(orEmpty(request.getMerchant())),
                "location",      AttributeValue.fromS(orEmpty(request.getLocation())),
                "fraudulent",    AttributeValue.fromBool(request.isFraudulent()),
                "confidenceScore", AttributeValue.fromS(String.valueOf(request.getConfidenceScore()))
        );
        dynamoDbClient.putItem(PutItemRequest.builder().tableName(tableName).item(item).build());
        return toResponse(item);
    }

    public ResultResponse getByTransactionId(String transactionId) {
        GetItemResponse response = dynamoDbClient.getItem(GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("transactionId", AttributeValue.fromS(transactionId)))
                .build());
        if (!response.hasItem()) {
            throw new RuntimeException("Result not found for transactionId: " + transactionId);
        }
        return toResponse(response.item());
    }

    public List<ResultResponse> getAll() {
        ScanResponse response = dynamoDbClient.scan(ScanRequest.builder().tableName(tableName).build());
        return response.items().stream().map(this::toResponse).toList();
    }

    private ResultResponse toResponse(Map<String, AttributeValue> item) {
        String transactionId = str(item.get("transactionId"));
        return ResultResponse.builder()
                .id(transactionId)
                .transactionId(transactionId)
                .cardNumber(str(item.get("cardNumber")))
                .amount(parseDouble(item.get("amount")))
                .merchant(str(item.get("merchant")))
                .location(str(item.get("location")))
                .fraudulent(bool(item.get("fraudulent")))
                .confidenceScore(parseDoubleOrZero(item.get("confidenceScore")))
                .createdAt(null)
                .build();
    }

    private static String orEmpty(String s) { return s != null ? s : ""; }
    private static String str(AttributeValue av) { return av != null && av.s() != null ? av.s() : ""; }
    private static boolean bool(AttributeValue av) { return av != null && Boolean.TRUE.equals(av.bool()); }
    private static Double parseDouble(AttributeValue av) {
        if (av == null) return null;
        try { return av.s() != null ? Double.parseDouble(av.s()) : null; } catch (NumberFormatException e) { return null; }
    }
    private static double parseDoubleOrZero(AttributeValue av) {
        Double d = parseDouble(av);
        return d != null ? d : 0.0;
    }
}
