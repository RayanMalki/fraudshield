package com.examplecom.fraudshield.ingestion_service.grpc;

import com.examplecom.fraudshield.ingestion_service.dto.TransactionRequest;
import com.examplecom.fraudshield.ingestion_service.dto.TransactionResponse;
import com.fraudshield.ingestion.grpc.FraudDetectionServiceGrpc;
import com.fraudshield.ingestion.grpc.FraudRequest;
import com.fraudshield.ingestion.grpc.FraudResponse;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MLServiceClient {

    private final FraudDetectionServiceGrpc.FraudDetectionServiceBlockingStub stub;

    public MLServiceClient(
            @Value("${ml.service.host:localhost}") String host,
            @Value("${ml.service.port:50051}") int port) {
        ManagedChannel channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        this.stub = FraudDetectionServiceGrpc.newBlockingStub(channel);
    }

    public TransactionResponse predict(TransactionRequest request) {
        FraudRequest grpcRequest = FraudRequest.newBuilder()
                .setTransactionId(request.getTransactionId())
                .setCardNumber(request.getCardNumber())
                .setAmount(request.getAmount())
                .setMerchant(request.getMerchant())
                .setLocation(request.getLocation())
                .build();

        FraudResponse grpcResponse = stub.predictFraud(grpcRequest);

        return new TransactionResponse(
                grpcResponse.getTransactionId(),
                grpcResponse.getFraudulent(),
                grpcResponse.getConfidenceScore(),
                grpcResponse.getFraudulent() ? "FLAGGED" : "APPROVED"
        );
    }
}