package com.user.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO matching the event from transaction-service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEvent {
    private String transactionId;
    private Long userId;
    private String type;
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal amountIn;
    private BigDecimal amountOut;
    private String status;
}
