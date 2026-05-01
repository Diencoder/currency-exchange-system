package com.user.transaction.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransactionRequest {
    private Long userId;
    private String type; // EXCHANGE, TRANSFER, P2P_BUY, P2P_SELL
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal amountIn;
    private BigDecimal amountOut;
    private BigDecimal rate;
    private String idempotencyKey;
    private String description;
}
