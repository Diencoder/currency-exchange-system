package com.user.p2p.repository;

import com.user.p2p.entity.P2PReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface P2PReviewRepository extends JpaRepository<P2PReview, Long> {
    List<P2PReview> findByToUserId(Long toUserId);
    List<P2PReview> findByOrderId(Long orderId);
}
