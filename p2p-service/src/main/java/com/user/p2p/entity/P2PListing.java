package com.user.p2p.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "p2p_listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class P2PListing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sellerId;

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

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum RateType { FIXED, FLOATING }
    public enum ListingStatus { ACTIVE, PAUSED, COMPLETED, CANCELLED }
}
