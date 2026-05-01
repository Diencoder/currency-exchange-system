package com.user.transaction.dto;

import com.user.common.dto.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Long id;
    private Long userId;
    private String type; // BUY, SELL, SWAP
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal fromAmount;
    private BigDecimal toAmount;
    private BigDecimal exchangeRate;
    private TransactionStatus status;
    private LocalDateTime createdAt;
    private String description;
}
