package com.user.transaction.factory;

import com.user.common.dto.TransactionStatus;
import com.user.transaction.entity.Transaction;
import com.user.transaction.strategy.FeeStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Factory for creating Transaction entities.
 * This is an application of the Factory Pattern.
 */
@Component
@RequiredArgsConstructor
public class TransactionFactory {

    @Qualifier("defaultFeeStrategy")
    private final FeeStrategy defaultFeeStrategy;

    @Qualifier("p2pFeeStrategy")
    private final FeeStrategy p2pFeeStrategy;

    public Transaction createExchangeTransaction(Long userId, String from, String to, BigDecimal amountIn, BigDecimal amountOut, BigDecimal rate, String idempotencyKey) {
        BigDecimal fee = defaultFeeStrategy.calculate(amountIn);
        
        return Transaction.builder()
                .userId(userId)
                .type("EXCHANGE")
                .fromCurrency(from)
                .toCurrency(to)
                .amountIn(amountIn)
                .amountOut(amountOut)
                .rate(rate)
                .fee(fee)
                .idempotencyKey(idempotencyKey)
                .status(TransactionStatus.PROCESSING)
                .description("Exchange from " + from + " to " + to)
                .build();
    }

    public Transaction createP2PTransaction(Long userId, String type, String currency, BigDecimal amount, String idempotencyKey, String referenceId) {
        BigDecimal fee = p2pFeeStrategy.calculate(amount);
        
        return Transaction.builder()
                .userId(userId)
                .type(type) // P2P_BUY or P2P_SELL
                .fromCurrency(currency)
                .toCurrency(currency)
                .amountIn(amount)
                .amountOut(amount)
                .rate(BigDecimal.ONE)
                .fee(fee)
                .idempotencyKey(idempotencyKey)
                .referenceId(referenceId)
                .status(TransactionStatus.PROCESSING)
                .description("P2P Transaction: " + type)
                .build();
    }
}
