package com.user.common.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEvent {
    private String transactionId;
    private Long userId;
    private String type; // e.g., EXCHANGE, TRANSFER, P2P
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal amount;
    private BigDecimal rate;
    private String status;
    private String idempotencyKey;
    private Map<String, Object> metadata;
}
