package com.user.exchange.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyTrend {
    private String code;
    private String name;
    private BigDecimal currentRate;
    private BigDecimal changePercentage;
    private BigDecimal volume24h; // Simulated for now
}
