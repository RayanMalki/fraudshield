package com.examplecom.fraudshield.ingestion_service.service;

import com.examplecom.fraudshield.ingestion_service.dto.TransactionRequest;
import com.examplecom.fraudshield.ingestion_service.dto.TransactionResponse;
import com.examplecom.fraudshield.ingestion_service.grpc.MLServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final MLServiceClient mlServiceClient;

    public TransactionResponse analyze(TransactionRequest request) {
        try {
            return mlServiceClient.predict(request);
        } catch (Exception e) {
            // Placeholder until gRPC is fully wired in
            return new TransactionResponse(request.getTransactionId(), false, 0.0, "PENDING");
        }
    }
}