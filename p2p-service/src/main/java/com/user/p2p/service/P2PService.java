package com.user.p2p.service;

import com.user.common.dto.P2PEvent;
import com.user.p2p.client.UserClient;
import com.user.p2p.dto.EscrowTransactionDTO;
import com.user.p2p.dto.P2PListingDTO;
import com.user.p2p.dto.P2PListingRequest;
import com.user.p2p.entity.EscrowTransaction;
import com.user.p2p.entity.P2PListing;
import com.user.p2p.repository.EscrowTransactionRepository;
import com.user.p2p.repository.P2PListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class P2PService {

    private final P2PListingRepository listingRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final UserClient userClient;

    @Value("${app.kafka.p2p-topic}")
    private String p2pTopic;

    public List<P2PListingDTO> getActiveListings() {
        return listingRepository.findByStatus(P2PListing.ListingStatus.ACTIVE).stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public P2PListingDTO createListing(P2PListingRequest request) {
        P2PListing listing = P2PListing.builder()
                .sellerId(request.getSellerId())
                .fromCurrency(request.getFromCurrency())
                .toCurrency(request.getToCurrency())
                .totalAmount(request.getTotalAmount())
                .remainingAmount(request.getTotalAmount())
                .minLimit(request.getMinLimit())
                .rateType(P2PListing.RateType.valueOf(request.getRateType()))
                .fixedRate(request.getFixedRate())
                .marginPercent(request.getMarginPercent())
                .status(P2PListing.ListingStatus.ACTIVE)
                .build();
        
        return convertToDTO(listingRepository.save(listing));
    }

    @Transactional
    public EscrowTransactionDTO initiateEscrow(Long listingId, Long buyerId, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null) {
            var existing = escrowRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return convertToEscrowDTO(existing.get());
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
                .build();

        return convertToEscrowDTO(escrowRepository.save(escrow));
    }

    @Transactional
    public EscrowTransactionDTO releaseEscrow(Long escrowId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow not found"));

        if (escrow.getStatus() != EscrowTransaction.EscrowStatus.HOLDING) {
            throw new RuntimeException("Escrow is not in HOLDING state");
        }

        escrow.setStatus(EscrowTransaction.EscrowStatus.RELEASED);
        
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
        
        return convertToEscrowDTO(escrowRepository.save(escrow));
    }

    private P2PListingDTO convertToDTO(P2PListing listing) {
        P2PListingDTO dto = new P2PListingDTO();
        dto.setId(listing.getId());
        dto.setSellerId(listing.getSellerId());
        
        try {
            var user = userClient.getUserById(listing.getSellerId());
            dto.setUsername(user != null ? user.getUsername() : "Unknown");
        } catch (Exception e) {
            dto.setUsername("Unknown");
        }

        dto.setFromCurrency(listing.getFromCurrency());
        dto.setToCurrency(listing.getToCurrency());
        dto.setTotalAmount(listing.getTotalAmount());
        dto.setRemainingAmount(listing.getRemainingAmount());
        dto.setMinLimit(listing.getMinLimit());
        dto.setRateType(listing.getRateType().toString());
        dto.setFixedRate(listing.getFixedRate());
        dto.setMarginPercent(listing.getMarginPercent());
        dto.setStatus(listing.getStatus().toString());
        dto.setCreatedAt(listing.getCreatedAt());
        return dto;
    }

    private EscrowTransactionDTO convertToEscrowDTO(EscrowTransaction escrow) {
        EscrowTransactionDTO dto = new EscrowTransactionDTO();
        dto.setId(escrow.getId());
        dto.setListingId(escrow.getListingId());
        dto.setBuyerId(escrow.getBuyerId());
        dto.setSellerId(escrow.getSellerId());
        dto.setAmount(escrow.getAmount());
        dto.setStatus(escrow.getStatus().toString());
        dto.setBuyerConfirmed(escrow.isBuyerConfirmed());
        dto.setSellerConfirmed(escrow.isSellerConfirmed());
        dto.setCreatedAt(escrow.getCreatedAt());
        dto.setUpdatedAt(escrow.getUpdatedAt());
        return dto;
    }
}
