package com.user.transaction.service;

import com.user.common.dto.TransactionStatus;
import com.user.transaction.dto.TransactionDTO;
import com.user.transaction.dto.TransactionRequest;
import com.user.transaction.entity.Transaction;
import com.user.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final com.user.transaction.factory.TransactionFactory transactionFactory;
    private final AsyncNotificationService asyncNotificationService;
    private final KafkaProducerService kafkaProducerService;

    // Sử dụng AtomicLong để đảm bảo an toàn đa luồng khi đếm tổng số giao dịch
    private final java.util.concurrent.atomic.AtomicLong totalTransactionsProcessed = new java.util.concurrent.atomic.AtomicLong(0);

    @Transactional
    public List<TransactionDTO> getTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionDTO createTransaction(TransactionRequest request) {
        // Idempotency Check
        if (request.getIdempotencyKey() != null) {
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return convertToDTO(existing.get());
            }
        }
        
        Transaction transaction = convertToEntity(request);
        transaction.setStatus(TransactionStatus.PROCESSING);

        Transaction saved = transactionRepository.save(transaction);

        // Tăng bộ đếm tổng số giao dịch một cách an toàn (Thread-safe)
        totalTransactionsProcessed.incrementAndGet();

        // --- ĐA LUỒNG (MULTITHREADING) ---
        // Gọi gửi thông báo bất đồng bộ (chạy ngầm)
        asyncNotificationService.sendTransactionNotification(saved.getId(), saved.getType());
        
        // --- KAFKA (ASYNC COMMUNICATION) ---
        // Gửi sự kiện giao dịch sang Kafka để các service khác tiêu thụ
        kafkaProducerService.sendTransactionEvent(saved);
        
        return convertToDTO(saved);
    }

    public long getTotalProcessedCount() {
        return totalTransactionsProcessed.get();
    }

    /**
     * Specialized method using Factory Pattern.
     */
    @Transactional
    public TransactionDTO initiateExchange(Long userId, String from, String to, java.math.BigDecimal amountIn, java.math.BigDecimal amountOut, java.math.BigDecimal rate, String idempotencyKey) {
        Transaction transaction = transactionFactory.createExchangeTransaction(userId, from, to, amountIn, amountOut, rate, idempotencyKey);
        return convertToDTO(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionDTO updateStatus(Long id, TransactionStatus status) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + id));

        // Use Encapsulation to check business rules
        if (status == TransactionStatus.CANCELLED && !transaction.canBeCancelled()) {
            throw new RuntimeException("Transaction cannot be cancelled in its current state: " + transaction.getStatus());
        }

        if (isValidTransition(transaction.getStatus(), status)) {
            transaction.setStatus(status);
            transaction.setUpdatedAt(LocalDateTime.now());
            return convertToDTO(transactionRepository.save(transaction));
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

    private Transaction convertToEntity(TransactionRequest request) {
        return Transaction.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .fromCurrency(request.getFromCurrency())
                .toCurrency(request.getToCurrency())
                .amountIn(request.getAmountIn())
                .amountOut(request.getAmountOut())
                .rate(request.getRate())
                .idempotencyKey(request.getIdempotencyKey())
                .description(request.getDescription())
                .build();
    }

    private TransactionDTO convertToDTO(Transaction transaction) {
        return TransactionDTO.builder()
                .id(transaction.getId())
                .userId(transaction.getUserId())
                .type(transaction.getType())
                .fromCurrency(transaction.getFromCurrency())
                .toCurrency(transaction.getToCurrency())
                .fromAmount(transaction.getAmountIn())
                .toAmount(transaction.getAmountOut())
                .exchangeRate(transaction.getRate())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .description(transaction.getDescription())
                .build();
    }
}
