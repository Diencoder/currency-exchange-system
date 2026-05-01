package com.user.transaction.strategy.impl;

import com.user.transaction.strategy.FeeStrategy;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Default fee strategy: 0.1% of the amount.
 */
@Component("defaultFeeStrategy")
public class DefaultFeeStrategy implements FeeStrategy {
    
    private static final BigDecimal FEE_PERCENT = new BigDecimal("0.001"); // 0.1%

    @Override
    public BigDecimal calculate(BigDecimal amount) {
        if (amount == null) return BigDecimal.ZERO;
        return amount.multiply(FEE_PERCENT).setScale(8, RoundingMode.HALF_UP);
    }

    @Override
    public String getStrategyName() {
        return "DEFAULT_PERCENTAGE_FEE";
    }
}
