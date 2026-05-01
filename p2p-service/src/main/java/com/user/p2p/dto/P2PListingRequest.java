package com.user.p2p.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class P2PListingRequest {
    private Long sellerId;
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal totalAmount;
    private BigDecimal minLimit;
    private String rateType;
    private BigDecimal fixedRate;
    private BigDecimal marginPercent;
}
