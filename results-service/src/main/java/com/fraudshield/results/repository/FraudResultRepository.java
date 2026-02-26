package com.fraudshield.results.repository;

import com.fraudshield.results.entity.FraudResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FraudResultRepository extends JpaRepository<FraudResult, String> {
    Optional<FraudResult> findByTransactionId(String transactionId);
}
