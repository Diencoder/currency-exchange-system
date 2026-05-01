package com.user.service.controller;

import com.user.common.dto.WalletDTO;
import com.user.service.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WalletDTO>> getWalletsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getWalletsByUserId(userId));
    }

    @PostMapping("/deposit")
    public ResponseEntity<WalletDTO> deposit(@RequestParam Long userId, @RequestParam String currencyCode, @RequestParam java.math.BigDecimal amount) {
        return ResponseEntity.ok(walletService.deposit(userId, currencyCode, amount));
    }
}
