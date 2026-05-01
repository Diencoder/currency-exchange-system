package com.user.transaction.service;

import com.user.common.dto.TransactionEvent;
import com.user.transaction.entity.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Service to send messages to Kafka.
 * This is the Producer in the Kafka architecture.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaProducerService {

    private static final String TOPIC = "transaction-events";
    private final KafkaTemplate<String, TransactionEvent> kafkaTemplate;

    public void sendTransactionEvent(Transaction transaction) {
        TransactionEvent event = TransactionEvent.builder()
                .transactionId(transaction.getId().toString())
                .userId(transaction.getUserId())
                .type(transaction.getType())
                .fromCurrency(transaction.getFromCurrency())
                .toCurrency(transaction.getToCurrency())
                .amountIn(transaction.getAmountIn())
                .amountOut(transaction.getAmountOut())
                .status(transaction.getStatus().toString())
                .build();

        log.info("Đang gửi sự kiện giao dịch tới Kafka topic {}: {}", TOPIC, event);
        
        // Gửi đi một cách bất đồng bộ
        kafkaTemplate.send(TOPIC, event);
    }
}
