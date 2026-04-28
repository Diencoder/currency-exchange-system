package com.user.exchange.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_ohlc")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateOHLC {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "currency_pair", nullable = false, length = 20)
    private String currencyPair;

    @Column(name = "time_interval", nullable = false)
    private String timeInterval; // 1m, 5m, 1h, 1d

    @Column(name = "open_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal open;

    @Column(name = "high_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal high;

    @Column(name = "low_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal low;

    @Column(name = "close_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal close;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
