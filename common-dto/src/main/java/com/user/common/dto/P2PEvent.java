package com.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class P2PEvent {
    private String eventType; // RELEASED, CANCELLED
    private Long escrowId;
    private Long buyerId;
    private Long sellerId;
    private String currencyCode;
    private BigDecimal amount;
}
