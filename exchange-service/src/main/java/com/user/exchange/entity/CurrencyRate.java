package com.user.exchange.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "currency_rates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrencyRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code; // e.g., USD, EUR, VND

    private String name; // e.g., US Dollar

    @Column(precision = 18, scale = 6)
    private BigDecimal rateToBase; // Rate relative to a base currency (e.g., USD)

    private LocalDateTime updatedAt;
}
