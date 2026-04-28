package com.user.exchange.repository;

import com.user.exchange.entity.CurrencyRate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CurrencyRateRepository extends JpaRepository<CurrencyRate, Long> {
    Optional<CurrencyRate> findByCode(String code);
}
