package com.user.exchange.repository;

import com.user.exchange.entity.RateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RateHistoryRepository extends JpaRepository<RateHistory, Long> {
    List<RateHistory> findByCurrencyPairOrderByRecordedAtDesc(String currencyPair);
}
