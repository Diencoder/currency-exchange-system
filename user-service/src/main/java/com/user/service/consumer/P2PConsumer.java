package com.user.service.consumer;

import com.user.common.dto.P2PEvent;
import com.user.service.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class P2PConsumer {

    private final WalletService walletService;

    @KafkaListener(topics = "${app.kafka.p2p-topic}", groupId = "user-service-group")
    public void consumeP2PEvent(P2PEvent event) {
        log.info("Received P2P settlement event: {}", event);

        if ("RELEASED".equals(event.getEventType())) {
            try {
                walletService.transferP2P(
                        event.getSellerId(),
                        event.getBuyerId(),
                        event.getCurrencyCode(),
                        event.getAmount()
                );
                log.info("Successfully settled P2P escrow #{}", event.getEscrowId());
            } catch (Exception e) {
                log.error("Failed to settle P2P escrow #{}: {}", event.getEscrowId(), e.getMessage());
            }
        }
    }
}
