package com.user.p2p.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class EscrowTransactionDTO {
    private Long id;
    private Long listingId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal amount;
    private String status;
    private boolean buyerConfirmed;
    private boolean sellerConfirmed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
