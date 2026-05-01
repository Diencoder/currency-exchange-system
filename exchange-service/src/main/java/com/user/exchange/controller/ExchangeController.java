package com.user.exchange.controller;

import com.user.exchange.dto.CurrencyRateDTO;
import com.user.exchange.dto.CurrencyTrend;
import com.user.exchange.dto.RateOHLCDTO;
import com.user.exchange.service.ExchangeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exchange")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;

    @GetMapping("/rates")
    public ResponseEntity<List<CurrencyRateDTO>> getAllRates() {
        return ResponseEntity.ok(exchangeService.getAllRates());
    }

    @GetMapping("/rates/{code}")
    public ResponseEntity<CurrencyRateDTO> getRate(@PathVariable String code) {
        return exchangeService.getRateByCode(code.toUpperCase())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ohlc")
    public ResponseEntity<List<RateOHLCDTO>> getOHLC(@RequestParam("pair") String pair) {
        return ResponseEntity.ok(exchangeService.getOHLCData(pair));
    }

    @GetMapping("/trends")
    public ResponseEntity<List<CurrencyTrend>> getTrends() {
        return ResponseEntity.ok(exchangeService.getTrends());
    }
}
