package com.fraudshield.results.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultResponse {
    private String id;
    private String transactionId;
    private String cardNumber;
    private Double amount;
    private String merchant;
    private String location;
    private boolean fraudulent;
    private double confidenceScore;
    private LocalDateTime createdAt;
}
