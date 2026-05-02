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
    private BigDecimal totalPrice;
    private String fromCurrency;
    private String toCurrency;
    private String status;
    private boolean buyerConfirmed;
    private boolean sellerConfirmed;
    private String paymentProof;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
