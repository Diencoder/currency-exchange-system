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

    @Column(unique = true)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    private EscrowStatus status = EscrowStatus.HOLDING;

    private boolean buyerConfirmed = false;
    private boolean sellerConfirmed = false;

    public enum EscrowStatus { HOLDING, RELEASED, DISPUTED, CANCELLED, REFUNDED }
}
