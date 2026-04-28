package com.user.exchange.repository;

import com.user.exchange.entity.RateOHLC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RateOHLCRepository extends JpaRepository<RateOHLC, Long> {
    List<RateOHLC> findByCurrencyPairOrderByTimestampAsc(String currencyPair);
    List<RateOHLC> findTop100ByCurrencyPairOrderByTimestampDesc(String currencyPair);
}
