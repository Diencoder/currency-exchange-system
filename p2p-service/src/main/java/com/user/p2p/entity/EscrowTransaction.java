package com.user.p2p.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "escrow_transactions")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscrowTransaction extends BaseEntity {

    @Column(nullable = false)
    private Long listingId;

    @Column(nullable = false)
    private Long buyerId;

    @Column(nullable = false)
    private Long sellerId;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal amount;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private String fromCurrency;

    @Column(nullable = false)
    private String toCurrency;

    @Column(unique = true)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    private EscrowStatus status = EscrowStatus.PENDING;

    private boolean buyerConfirmed = false;
    private boolean sellerConfirmed = false;

    private String paymentProof; // URL to screenshot if needed

    public enum EscrowStatus { PENDING, PAID, RELEASED, DISPUTED, CANCELLED, REFUNDED }
}
