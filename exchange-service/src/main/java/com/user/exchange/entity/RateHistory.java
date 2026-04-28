package com.user.exchange.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "currency_pair", nullable = false, length = 20)
    private String currencyPair; // e.g., USD/VND

    @Column(precision = 18, scale = 8, nullable = false)
    private BigDecimal rate;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
    }
}
