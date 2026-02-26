package com.fraudshield.results.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String transactionId;
    private String cardNumber;
    private Double amount;
    private String merchant;
    private String location;
    private boolean fraudulent;
    private double confidenceScore;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
