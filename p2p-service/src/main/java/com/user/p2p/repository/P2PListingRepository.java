package com.user.p2p.repository;

import com.user.p2p.entity.P2PListing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface P2PListingRepository extends JpaRepository<P2PListing, Long> {
    List<P2PListing> findByStatus(P2PListing.ListingStatus status);
    List<P2PListing> findBySellerId(Long sellerId);
}
