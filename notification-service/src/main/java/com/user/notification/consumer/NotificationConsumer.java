package com.user.notification.consumer;

import com.user.common.dto.TransactionEvent;
import com.user.common.dto.P2PEvent;
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
        
        // Broadcast to specific user if userId is available in TransactionEvent
        if (event.getUserId() != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + event.getUserId(), notification);
        } else {
            messagingTemplate.convertAndSend("/topic/notifications", notification);
        }
    }

    @KafkaListener(topics = "p2p-events", groupId = "notification-group")
    public void consumeP2P(P2PEvent event) {
        logger.info("Received P2P event: {}", event);
        
        String type = event.getEventType();
        
        Map<String, Object> notification = Map.of(
            "title", "P2P Trade Update",
            "message", "Your P2P trade status is now: " + type,
            "type", "info"
        );
        
        if (event.getSellerId() != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + event.getSellerId(), notification);
        }
        if (event.getBuyerId() != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + event.getBuyerId(), notification);
        }
    }
}
