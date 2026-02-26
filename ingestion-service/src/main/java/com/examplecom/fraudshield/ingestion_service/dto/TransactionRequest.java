package com.examplecom.fraudshield.ingestion_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor


public class TransactionRequest {

    String transactionId;
    String cardNumber;
    Double amount;
    String merchant;
    String location;
    LocalDateTime timestamp;
}
