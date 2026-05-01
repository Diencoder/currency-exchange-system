package com.user.transaction.controller;

import com.user.common.dto.TransactionStatus;
import com.user.transaction.dto.TransactionDTO;
import com.user.transaction.dto.TransactionRequest;
import com.user.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // Lấy lịch sử giao dịch theo userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionDTO>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserId(userId));
    }

    // Thống kê tổng số giao dịch đã xử lý trong phiên này (Demo Thread-safety)
    @GetMapping("/stats/total")
    public ResponseEntity<Map<String, Long>> getTotalStats() {
        return ResponseEntity.ok(Map.of("totalProcessedInSession", transactionService.getTotalProcessedCount()));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<TransactionDTO>> getBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserId(sellerId));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<TransactionDTO>> getByBuyer(@PathVariable Long buyerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByUserId(buyerId));
    }

    // Tạo giao dịch mới (bao gồm kiểm tra Idempotency Key)
    @PostMapping
    public ResponseEntity<TransactionDTO> create(@RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.createTransaction(request));
    }

    // Cập nhật trạng thái giao dịch
    @PutMapping("/{id}/status")
    public ResponseEntity<TransactionDTO> updateStatus(@PathVariable Long id, @RequestParam TransactionStatus status) {
        return ResponseEntity.ok(transactionService.updateStatus(id, status));
    }
}
