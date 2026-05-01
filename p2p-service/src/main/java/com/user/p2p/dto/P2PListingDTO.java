package com.user.p2p.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class P2PListingDTO {
    private Long id;
    private Long sellerId;
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal totalAmount;
    private BigDecimal remainingAmount;
    private BigDecimal minLimit;
    private String rateType;
    private BigDecimal fixedRate;
    private BigDecimal marginPercent;
    private String status;
    private String username;
    private LocalDateTime createdAt;
}
