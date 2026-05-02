package com.user.p2p.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "p2p_listings")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class P2PListing extends BaseEntity {

    @Column(nullable = false)
    private Long sellerId; // This is the merchant ID

    @Enumerated(EnumType.STRING)
    private ListingType type = ListingType.SELL;

    @Column(nullable = false)
    private String fromCurrency;

    @Column(nullable = false)
    private String toCurrency;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal remainingAmount;

    private BigDecimal minLimit;

    @Enumerated(EnumType.STRING)
    private RateType rateType = RateType.FIXED;

    private BigDecimal fixedRate;

    private BigDecimal marginPercent;

    @Enumerated(EnumType.STRING)
    private ListingStatus status = ListingStatus.ACTIVE;

    public enum ListingType { BUY, SELL }
    public enum RateType { FIXED, FLOATING }
    public enum ListingStatus { ACTIVE, PAUSED, COMPLETED, CANCELLED }
}
