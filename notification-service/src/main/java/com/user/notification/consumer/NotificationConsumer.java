package com.user.notification.consumer;

import com.user.common.dto.TransactionEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {
    private static final Logger logger = LoggerFactory.getLogger(NotificationConsumer.class);

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "transaction-events", groupId = "notification-group")
    public void consumeTransaction(TransactionEvent event) {
        logger.info("Received transaction event: {}", event);
        
        String status = event.getStatus();
        String transactionId = event.getTransactionId();
        
        Map<String, Object> notification = Map.of(
            "title", "Transaction Update",
            "message", "Order #" + transactionId + " is now " + status,
            "type", "success"
        );
        
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    @KafkaListener(topics = "p2p-events", groupId = "notification-group")
    public void consumeP2P(Map<String, Object> message) {
        logger.info("Received P2P event: {}", message);
        
        String type = (String) message.get("type");
        String status = (String) message.get("status");
        
        Map<String, Object> notification = Map.of(
            "title", "P2P Alert",
            "message", "P2P " + type + " trade is now " + status,
            "type", "info"
        );
        
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
