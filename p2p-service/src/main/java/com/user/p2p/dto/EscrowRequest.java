package com.user.p2p.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EscrowRequest {
    private Long listingId;
    private Long buyerId;
    private BigDecimal amount;
    private String idempotencyKey;
}
