package com.examplecom.fraudshield.ingestion_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResult {

    @JsonProperty("is_fraud")
    private boolean fraud;

    private double confidence;
}
