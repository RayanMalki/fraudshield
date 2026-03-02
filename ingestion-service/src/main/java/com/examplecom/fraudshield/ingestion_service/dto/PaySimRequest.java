package com.examplecom.fraudshield.ingestion_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaySimRequest {

    public enum TransactionType {
        TRANSFER, CASH_OUT, PAYMENT, CASH_IN, DEBIT
    }

    private int step;
    private TransactionType type;
    private double amount;
    private double oldbalanceOrg;
    private double newbalanceOrig;
    private double oldbalanceDest;
    private double newbalanceDest;
}
