package com.user.transaction.service;

import com.user.common.dto.TransactionStatus;
import com.user.transaction.entity.Transaction;
import com.user.transaction.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    public List<Transaction> getTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction) {
        // Idempotency Check: Ngăn chặn giao dịch trùng lặp
        if (transaction.getIdempotencyKey() != null) {
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(transaction.getIdempotencyKey());
            if (existing.isPresent()) {
                return existing.get(); // Trả về kết quả cũ thay vì tạo mới
            }
        }

        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUpdatedAt(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction updateStatus(Long id, TransactionStatus status) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + id));

        if (isValidTransition(transaction.getStatus(), status)) {
            transaction.setStatus(status);
            transaction.setUpdatedAt(LocalDateTime.now());
            return transactionRepository.save(transaction);
        } else {
            throw new RuntimeException("Invalid status transition from "
                    + transaction.getStatus() + " to " + status);
        }
    }

    private boolean isValidTransition(TransactionStatus current, TransactionStatus next) {
        return switch (current) {
            case CREATED     -> next == TransactionStatus.PROCESSING || next == TransactionStatus.CANCELLED;
            case PROCESSING  -> next == TransactionStatus.LOCKED || next == TransactionStatus.FAILED || next == TransactionStatus.CANCELLED;
            case LOCKED      -> next == TransactionStatus.PAID || next == TransactionStatus.CANCELLED;
            case PAID        -> next == TransactionStatus.CONFIRMED || next == TransactionStatus.CANCELLED;
            case CONFIRMED   -> next == TransactionStatus.COMPLETED;
            default          -> false;
        };
    }
}
