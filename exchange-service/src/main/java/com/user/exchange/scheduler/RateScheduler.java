package com.user.exchange.scheduler;

import com.user.exchange.entity.CurrencyRate;
import com.user.exchange.entity.RateHistory;
import com.user.exchange.entity.RateOHLC;
import com.user.exchange.repository.CurrencyRateRepository;
import com.user.exchange.repository.RateHistoryRepository;
import com.user.exchange.repository.RateOHLCRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class RateScheduler {
    private static final Logger logger = LoggerFactory.getLogger(RateScheduler.class);
    private final Random random = new Random();

    private final CurrencyRateRepository rateRepository;
    private final RateHistoryRepository historyRepository;
    private final RateOHLCRepository ohlcRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void initRates() {
        if (rateRepository.count() == 0) {
            Map<String, BigDecimal> initialRates = new HashMap<>();
            initialRates.put("USD", new BigDecimal("1.0"));
            initialRates.put("EUR", new BigDecimal("0.92"));
            initialRates.put("VND", new BigDecimal("25410.0"));
            initialRates.put("GBP", new BigDecimal("0.79"));
            initialRates.put("JPY", new BigDecimal("151.7"));
            initialRates.put("BNB", new BigDecimal("580.5"));
            initialRates.put("BTC", new BigDecimal("64230.0"));
            initialRates.put("ETH", new BigDecimal("3450.0"));

            initialRates.forEach((code, rate) -> {
                CurrencyRate currencyRate = CurrencyRate.builder()
                        .code(code)
                        .name(getNameByCode(code))
                        .rateToBase(rate)
                        .build();
                rateRepository.save(currencyRate);
            });
            logger.info("Initialized base exchange rates.");
        }
    }

    @Scheduled(fixedRate = 10000) // Every 10 seconds
    public void updateRates() {
        List<Map<String, Object>> updates = new ArrayList<>();
        rateRepository.findAll().forEach(rate -> {
            if ("USD".equals(rate.getCode())) return; // USD is base

            BigDecimal oldRate = rate.getRateToBase();
            // 0.5% max fluctuation
            double fluctuation = 0.995 + (0.01 * random.nextDouble());
            BigDecimal newRate = oldRate.multiply(BigDecimal.valueOf(fluctuation))
                    .setScale(6, RoundingMode.HALF_UP);

            rate.setRateToBase(newRate);
            // updatedAt is handled by @PreUpdate in BaseEntity
            rateRepository.save(rate);

            String pair = "USD/" + rate.getCode();
            LocalDateTime now = LocalDateTime.now();

            // Lưu vào lịch sử phục vụ AI
            historyRepository.save(RateHistory.builder()
                    .currencyPair(pair)
                    .rate(newRate)
                    .recordedAt(now)
                    .build());

            // Tạo nến OHLC (Dữ liệu nến 10 giây)
            RateOHLC ohlc = RateOHLC.builder()
                    .currencyPair(pair)
                    .timeInterval("10s")
                    .open(oldRate)
                    .close(newRate)
                    .high(oldRate.max(newRate).multiply(BigDecimal.valueOf(1.001))) // Mock high/low for visual
                    .low(oldRate.min(newRate).multiply(BigDecimal.valueOf(0.999)))
                    .timestamp(now)
                    .build();
            ohlcRepository.save(ohlc);

            // Thu thập dữ liệu để push qua WebSocket
            Map<String, Object> update = new HashMap<>();
            update.put("code", rate.getCode());
            update.put("rate", newRate);
            update.put("pair", pair);
            update.put("ohlc", ohlc);
            updates.add(update);
        });
        
        // Push toàn bộ cập nhật xuống client
        messagingTemplate.convertAndSend("/topic/rates", updates);
        logger.info("Updated exchange rates and pushed to /topic/rates.");
    }

    private String getNameByCode(String code) {
        return switch (code) {
            case "USD" -> "US Dollar";
            case "EUR" -> "Euro";
            case "VND" -> "Vietnamese Dong";
            case "GBP" -> "British Pound";
            case "JPY" -> "Japanese Yen";
            default -> code;
        };
    }
}
