package com.user.notification.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationConsumer {
    private static final Logger logger = LoggerFactory.getLogger(NotificationConsumer.class);

    @KafkaListener(topics = "transaction-events", groupId = "notification-group")
    public void consume(Map<String, Object> message) {
        logger.info("Received transaction event: {}", message);
        
        // Logic to send notification via WebSocket or Email
        // For demo: just log the event
        String status = (String) message.get("status");
        Long transactionId = (Long) message.get("id");
        
        System.out.println(">>> NOTIFICATION: Transaction #" + transactionId + " is now " + status);
    }
}
