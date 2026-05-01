package com.user.transaction.strategy;

import java.math.BigDecimal;

/**
 * Strategy interface for calculating transaction fees.
 * This is an application of the Strategy Pattern (Polymorphism).
 */
public interface FeeStrategy {
    BigDecimal calculate(BigDecimal amount);
    String getStrategyName();
}
