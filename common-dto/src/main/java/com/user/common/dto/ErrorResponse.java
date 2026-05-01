package com.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response for all APIs.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private String status;       // FAILED, ERROR
    private String message;      // Human readable message
    private String errorCode;    // System code (e.g., WALLET_001)
    private LocalDateTime timestamp;
    private Map<String, String> details; // For validation errors
}
