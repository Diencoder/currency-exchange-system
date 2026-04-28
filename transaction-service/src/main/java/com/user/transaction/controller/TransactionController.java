package com.user.transaction.controller;

import com.user.common.dto.TransactionStatus;
import com.user.transaction.entity.Transaction;
import com.user.transaction.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    // Lấy lịch sử giao dịch theo userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Transaction>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserId(userId));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Transaction>> getBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserId(sellerId));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Transaction>> getByBuyer(@PathVariable Long buyerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserId(buyerId));
    }

    // Tạo giao dịch mới (bao gồm kiểm tra Idempotency Key)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Transaction transaction) {
        try {
            Transaction saved = transactionService.createTransaction(transaction);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Cập nhật trạng thái giao dịch
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam TransactionStatus status) {
        try {
            return ResponseEntity.ok(transactionService.updateStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
