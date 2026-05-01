package com.user.transaction.strategy.impl;

import com.user.transaction.strategy.FeeStrategy;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * P2P fee strategy: Higher fee (0.5%) for escrow services.
 */
@Component("p2pFeeStrategy")
public class P2PFeeStrategy implements FeeStrategy {
    
    private static final BigDecimal FEE_PERCENT = new BigDecimal("0.005"); // 0.5%

    @Override
    public BigDecimal calculate(BigDecimal amount) {
        if (amount == null) return BigDecimal.ZERO;
        return amount.multiply(FEE_PERCENT).setScale(8, RoundingMode.HALF_UP);
    }

    @Override
    public String getStrategyName() {
        return "P2P_ESCROW_FEE";
    }
}
