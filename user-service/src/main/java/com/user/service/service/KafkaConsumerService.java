package com.user.service.service;

import com.user.service.dto.TransactionEvent;
import com.user.service.entity.Wallet;
import com.user.service.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service to listen to Kafka messages.
 * This is the Consumer in the Kafka architecture.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final WalletRepository walletRepository;

    /**
     * Lắng nghe các sự kiện giao dịch từ Kafka.
     * Khi nhận được, nó sẽ tự động cập nhật số dư ví.
     */
    @KafkaListener(topics = "transaction-events", groupId = "user-service-group")
    @Transactional
    public void consumeTransactionEvent(TransactionEvent event) {
        log.info("Đã nhận được sự kiện giao dịch từ Kafka: {}", event);

        try {
            // 1. Tìm ví gửi (Từ đồng tiền gửi)
            Wallet fromWallet = walletRepository.findByUserIdAndCurrencyCode(event.getUserId(), event.getFromCurrency())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ví cho loại tiền: " + event.getFromCurrency()));

            // 2. Thực hiện trừ tiền (Sử dụng tính Đóng gói đã viết ở bước trước)
            fromWallet.withdraw(event.getAmountIn());
            walletRepository.save(fromWallet);
            log.info("Đã trừ {} {} từ ví người dùng {}", event.getAmountIn(), event.getFromCurrency(), event.getUserId());

            // 3. Nếu là giao dịch EXCHANGE, nạp tiền vào ví nhận
            if ("EXCHANGE".equals(event.getType()) && event.getToCurrency() != null) {
                Wallet toWallet = walletRepository.findByUserIdAndCurrencyCode(event.getUserId(), event.getToCurrency())
                        .orElseGet(() -> {
                            log.info("Ví {} chưa tồn tại, đang tạo mới...", event.getToCurrency());
                            return Wallet.builder()
                                    .user(fromWallet.getUser())
                                    .currencyCode(event.getToCurrency())
                                    .balance(java.math.BigDecimal.ZERO)
                                    .build();
                        });
                
                toWallet.deposit(event.getAmountOut());
                walletRepository.save(toWallet);
                log.info("Đã nạp {} {} vào ví người dùng {}", event.getAmountOut(), event.getToCurrency(), event.getUserId());
            }

        } catch (Exception e) {
            log.error("Lỗi khi xử lý sự kiện giao dịch từ Kafka", e);
            // Trong thực tế, bạn có thể gửi tin nhắn vào một "Dead Letter Topic" để xử lý sau.
        }
    }
}
