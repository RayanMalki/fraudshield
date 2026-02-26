package com.examplecom.fraudshield.ingestion_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionResponse {
    String transactionId;
    boolean fraudulent;
    double confidenceScore;
    String status;


}
