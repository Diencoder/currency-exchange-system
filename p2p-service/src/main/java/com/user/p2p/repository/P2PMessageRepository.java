package com.user.p2p.repository;

import com.user.p2p.entity.P2PMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface P2PMessageRepository extends JpaRepository<P2PMessage, Long> {
    List<P2PMessage> findByOrderIdOrderByCreatedAtAsc(Long orderId);
}
