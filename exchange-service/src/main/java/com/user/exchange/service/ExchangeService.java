package com.user.exchange.service;

import com.user.exchange.dto.CurrencyTrend;
import com.user.exchange.entity.CurrencyRate;
import com.user.exchange.entity.RateHistory;
import com.user.exchange.entity.RateOHLC;
import com.user.exchange.repository.CurrencyRateRepository;
import com.user.exchange.repository.RateHistoryRepository;
import com.user.exchange.repository.RateOHLCRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExchangeService {

    @Autowired
    private CurrencyRateRepository rateRepository;

    @Autowired
    private RateOHLCRepository ohlcRepository;

    @Autowired
    private RateHistoryRepository historyRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_RATE_PREFIX = "rate:";

    public List<CurrencyRate> getAllRates() {
        return rateRepository.findAll();
    }

    public List<RateOHLC> getOHLCData(String code) {
        return ohlcRepository.findTop100ByCurrencyPairOrderByTimestampDesc(code.toUpperCase());
    }


    public List<CurrencyTrend> getTrends() {
        List<CurrencyRate> rates = rateRepository.findAll();
        List<CurrencyTrend> trends = new ArrayList<>();

        for (CurrencyRate rate : rates) {
            List<RateHistory> history = historyRepository.findByCurrencyPairOrderByRecordedAtDesc(rate.getCode());
            
            BigDecimal currentPrice = rate.getRateToBase();
            BigDecimal oldPrice = currentPrice;
            
            if (!history.isEmpty()) {
                // Try to find rate from ~24h ago, or the oldest one available
                oldPrice = history.get(history.size() - 1).getRate();
            }

            BigDecimal change = BigDecimal.ZERO;
            if (oldPrice.compareTo(BigDecimal.ZERO) != 0) {
                change = currentPrice.subtract(oldPrice)
                        .divide(oldPrice, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            trends.add(CurrencyTrend.builder()
                    .code(rate.getCode())
                    .name(rate.getName())
                    .currentRate(currentPrice)
                    .changePercentage(change)
                    .volume24h(new BigDecimal(Math.random() * 100000).setScale(2, RoundingMode.HALF_UP)) // Simulated
                    .build());
        }

        // Return popular currencies or sorted by change
        return trends.stream()
                .sorted(Comparator.comparing(CurrencyTrend::getChangePercentage).reversed())
                .collect(Collectors.toList());
    }

    public Optional<CurrencyRate> getRateByCode(String code) {
        String cacheKey = REDIS_RATE_PREFIX + code;
        
        CurrencyRate cachedRate = (CurrencyRate) redisTemplate.opsForValue().get(cacheKey);
        if (cachedRate != null) {
            return Optional.of(cachedRate);
        }

        Optional<CurrencyRate> rateOpt = rateRepository.findByCode(code);
        rateOpt.ifPresent(rate -> redisTemplate.opsForValue().set(cacheKey, rate, Duration.ofMinutes(1)));
        
        return rateOpt;
    }
}
