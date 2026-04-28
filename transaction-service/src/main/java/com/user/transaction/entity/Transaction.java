package com.user.transaction.entity;

import com.user.common.dto.TransactionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String type; // EXCHANGE, TRANSFER, P2P_BUY, P2P_SELL, FEE

    private String fromCurrency;
    private String toCurrency;

    @Column(precision = 20, scale = 8)
    private java.math.BigDecimal amountIn;

    @Column(precision = 20, scale = 8)
    private java.math.BigDecimal amountOut;

    @Column(precision = 18, scale = 8)
    private java.math.BigDecimal rate;

    @Column(precision = 18, scale = 8)
    private java.math.BigDecimal fee;

    @Column(unique = true, length = 64)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    private String referenceId;
    private String description;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
