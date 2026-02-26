package com.fraudshield.results.controller;

import com.fraudshield.results.dto.ResultRequest;
import com.fraudshield.results.dto.ResultResponse;
import com.fraudshield.results.service.ResultsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultsController {

    private final ResultsService resultsService;

    @PostMapping
    public ResponseEntity<ResultResponse> save(@RequestBody ResultRequest request) {
        return ResponseEntity.ok(resultsService.save(request));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<ResultResponse> getByTransactionId(@PathVariable String transactionId) {
        return ResponseEntity.ok(resultsService.getByTransactionId(transactionId));
    }

    @GetMapping
    public ResponseEntity<List<ResultResponse>> getAll() {
        return ResponseEntity.ok(resultsService.getAll());
    }
}
