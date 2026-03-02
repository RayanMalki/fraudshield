package com.examplecom.fraudshield.ingestion_service.controller;

import com.examplecom.fraudshield.ingestion_service.dto.PaySimRequest;
import com.examplecom.fraudshield.ingestion_service.dto.PredictionResult;
import com.examplecom.fraudshield.ingestion_service.dto.TransactionRequest;
import com.examplecom.fraudshield.ingestion_service.dto.TransactionResponse;
import com.examplecom.fraudshield.ingestion_service.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/analyze")
    public ResponseEntity<TransactionResponse> analyzeTransaction(
            @RequestBody TransactionRequest transactionRequest) {
        return ResponseEntity.ok(transactionService.analyze(transactionRequest));
    }

    @PostMapping("/predict")
    public ResponseEntity<PredictionResult> predict(
            @RequestBody PaySimRequest request) {
        return ResponseEntity.ok(transactionService.predictPaySim(request));
    }
}
