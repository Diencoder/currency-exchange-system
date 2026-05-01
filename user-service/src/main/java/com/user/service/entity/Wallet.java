package com.user.service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets", uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "currency_code"})})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode;

    @Column(precision = 20, scale = 8, nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "locked_balance", precision = 20, scale = 8, nullable = false)
    @Builder.Default
    private BigDecimal lockedBalance = BigDecimal.ZERO;

    @Version
    private Long version;

    /**
     * Business logic: Encapsulation
     * Nạp tiền vào ví.
     */
    public void deposit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
        this.balance = this.balance.add(amount);
    }

    /**
     * Business logic: Encapsulation
     * Rút tiền từ ví.
     */
    public void withdraw(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdraw amount must be positive");
        }
        if (this.balance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }
        this.balance = this.balance.subtract(amount);
    }

    /**
     * Business logic: Encapsulation
     * Khóa một phần số dư (dùng cho Escrow/P2P).
     */
    public void lockBalance(BigDecimal amount) {
        withdraw(amount); // Rút từ số dư khả dụng
        this.lockedBalance = this.lockedBalance.add(amount); // Chuyển vào số dư bị khóa
    }

    /**
     * Business logic: Encapsulation
     * Mở khóa số dư.
     */
    public void unlockBalance(BigDecimal amount) {
        if (this.lockedBalance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient locked balance");
        }
        this.lockedBalance = this.lockedBalance.subtract(amount);
        this.balance = this.balance.add(amount);
    }
}
