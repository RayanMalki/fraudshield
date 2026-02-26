package com.fraudshield.results.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultRequest {
    private String transactionId;
    private String cardNumber;
    private Double amount;
    private String merchant;
    private String location;
    private boolean fraudulent;
    private double confidenceScore;
}
