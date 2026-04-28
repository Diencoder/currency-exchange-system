package com.user.p2p.service;

import com.user.common.dto.P2PEvent;
import com.user.p2p.entity.EscrowTransaction;
import com.user.p2p.entity.P2PListing;
import com.user.p2p.repository.EscrowTransactionRepository;
import com.user.p2p.repository.P2PListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class P2PService {

    @Autowired
    private P2PListingRepository listingRepository;

    @Autowired
    private EscrowTransactionRepository escrowRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.p2p-topic}")
    private String p2pTopic;

    public List<P2PListing> getActiveListings() {
        return listingRepository.findByStatus(P2PListing.ListingStatus.ACTIVE);
    }

    public P2PListing createListing(P2PListing listing) {
        listing.setRemainingAmount(listing.getTotalAmount());
        listing.setCreatedAt(LocalDateTime.now());
        listing.setStatus(P2PListing.ListingStatus.ACTIVE);
        return listingRepository.save(listing);
    }

    @Transactional
    public EscrowTransaction initiateEscrow(Long listingId, Long buyerId, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null) {
            var existing = escrowRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return existing.get();
        }

        P2PListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (listing.getRemainingAmount().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient amount remaining in listing");
        }

        // Lock amount in listing
        listing.setRemainingAmount(listing.getRemainingAmount().subtract(amount));
        listingRepository.save(listing);

        EscrowTransaction escrow = EscrowTransaction.builder()
                .listingId(listingId)
                .buyerId(buyerId)
                .sellerId(listing.getSellerId())
                .amount(amount)
                .idempotencyKey(idempotencyKey)
                .status(EscrowTransaction.EscrowStatus.HOLDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return escrowRepository.save(escrow);
    }

    @Transactional
    public EscrowTransaction releaseEscrow(Long escrowId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow not found"));

        if (escrow.getStatus() != EscrowTransaction.EscrowStatus.HOLDING) {
            throw new RuntimeException("Escrow is not in HOLDING state");
        }

        escrow.setStatus(EscrowTransaction.EscrowStatus.RELEASED);
        escrow.setUpdatedAt(LocalDateTime.now());
        
        P2PListing listing = listingRepository.findById(escrow.getListingId())
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        // Trigger wallet transfer via Kafka
        P2PEvent event = P2PEvent.builder()
                .eventType("RELEASED")
                .escrowId(escrow.getId())
                .buyerId(escrow.getBuyerId())
                .sellerId(escrow.getSellerId())
                .currencyCode(listing.getFromCurrency())
                .amount(escrow.getAmount())
                .build();

        kafkaTemplate.send(p2pTopic, event);
        
        return escrowRepository.save(escrow);
    }
}
