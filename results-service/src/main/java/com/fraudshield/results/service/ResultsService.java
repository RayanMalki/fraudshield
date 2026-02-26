package com.fraudshield.results.service;

import com.fraudshield.results.dto.ResultRequest;
import com.fraudshield.results.dto.ResultResponse;
import com.fraudshield.results.entity.FraudResult;
import com.fraudshield.results.repository.FraudResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResultsService {

    private final FraudResultRepository fraudResultRepository;

    public ResultResponse save(ResultRequest request) {
        FraudResult entity = FraudResult.builder()
                .transactionId(request.getTransactionId())
                .cardNumber(request.getCardNumber())
                .amount(request.getAmount())
                .merchant(request.getMerchant())
                .location(request.getLocation())
                .fraudulent(request.isFraudulent())
                .confidenceScore(request.getConfidenceScore())
                .build();
        return toResponse(fraudResultRepository.save(entity));
    }

    public ResultResponse getByTransactionId(String transactionId) {
        FraudResult result = fraudResultRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Result not found for transactionId: " + transactionId));
        return toResponse(result);
    }

    public List<ResultResponse> getAll() {
        return fraudResultRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private ResultResponse toResponse(FraudResult entity) {
        return ResultResponse.builder()
                .id(entity.getId())
                .transactionId(entity.getTransactionId())
                .cardNumber(entity.getCardNumber())
                .amount(entity.getAmount())
                .merchant(entity.getMerchant())
                .location(entity.getLocation())
                .fraudulent(entity.isFraudulent())
                .confidenceScore(entity.getConfidenceScore())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
