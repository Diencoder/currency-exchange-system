package com.user.p2p.repository;

import com.user.p2p.entity.EscrowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EscrowTransactionRepository extends JpaRepository<EscrowTransaction, Long> {
    Optional<EscrowTransaction> findByIdempotencyKey(String idempotencyKey);
}
