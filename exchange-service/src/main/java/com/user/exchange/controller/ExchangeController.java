package com.user.exchange.controller;

import com.user.exchange.dto.CurrencyTrend;
import com.user.exchange.entity.CurrencyRate;
import com.user.exchange.service.ExchangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exchange")
public class ExchangeController {

    @Autowired
    private ExchangeService exchangeService;

    @GetMapping("/rates")
    public ResponseEntity<List<CurrencyRate>> getAllRates() {
        return ResponseEntity.ok(exchangeService.getAllRates());
    }

    @GetMapping("/rates/{code}")
    public ResponseEntity<CurrencyRate> getRate(@PathVariable String code) {
        return exchangeService.getRateByCode(code.toUpperCase())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ohlc")
    public ResponseEntity<List<com.user.exchange.entity.RateOHLC>> getOHLC(@RequestParam("pair") String pair) {
        return ResponseEntity.ok(exchangeService.getOHLCData(pair));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<CurrencyTrend>> getTrends() {
        return ResponseEntity.ok(exchangeService.getTrends());
    }
}
