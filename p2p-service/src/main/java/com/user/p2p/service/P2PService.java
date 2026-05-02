package com.user.p2p.service;

import com.user.common.dto.P2PEvent;
import com.user.p2p.client.UserClient;
import com.user.p2p.dto.EscrowTransactionDTO;
import com.user.p2p.dto.P2PListingDTO;
import com.user.p2p.dto.P2PListingRequest;
import com.user.p2p.entity.EscrowTransaction;
import com.user.p2p.entity.P2PListing;
import com.user.p2p.entity.P2PMessage;
import com.user.p2p.entity.P2PReview;
import com.user.p2p.repository.EscrowTransactionRepository;
import com.user.p2p.repository.P2PListingRepository;
import com.user.p2p.repository.P2PMessageRepository;
import com.user.p2p.repository.P2PReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class P2PService {

    private final P2PListingRepository listingRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final P2PMessageRepository messageRepository;
    private final P2PReviewRepository reviewRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final UserClient userClient;

    @Value("${app.kafka.p2p-topic}")
    private String p2pTopic;

    public List<P2PListingDTO> getActiveListings(String type) {
        P2PListing.ListingType listingType = type.equals("BUY") ? P2PListing.ListingType.SELL : P2PListing.ListingType.BUY;
        
        return listingRepository.findByStatus(P2PListing.ListingStatus.ACTIVE).stream()
                .filter(l -> l.getType() == listingType)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public P2PListingDTO createListing(P2PListingRequest request) {
        P2PListing listing = P2PListing.builder()
                .sellerId(request.getSellerId())
                .type(P2PListing.ListingType.valueOf(request.getType()))
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

    public P2PListingDTO updateListingPrice(Long listingId, Long sellerId, java.math.BigDecimal newPrice) {
        P2PListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (!listing.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Unauthorized to update this listing");
        }
        listing.setFixedRate(newPrice);
        return convertToDTO(listingRepository.save(listing));
    }

    public void cancelListing(Long listingId, Long sellerId) {
        P2PListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (!listing.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Unauthorized to cancel this listing");
        }
        listing.setStatus(P2PListing.ListingStatus.CANCELLED);
        listingRepository.save(listing);
    }

    @Transactional
    public EscrowTransactionDTO initiateEscrow(Long listingId, Long buyerId, java.math.BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null) {
            var existing = escrowRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return convertToEscrowDTO(existing.get());
        }

        P2PListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (listing.getRemainingAmount().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient amount remaining in listing");
        }

        BigDecimal totalPrice = amount.multiply(listing.getFixedRate());

        // Lock amount in listing
        listing.setRemainingAmount(listing.getRemainingAmount().subtract(amount));
        listingRepository.save(listing);

        EscrowTransaction escrow = EscrowTransaction.builder()
                .listingId(listingId)
                .buyerId(buyerId)
                .sellerId(listing.getSellerId())
                .amount(amount)
                .totalPrice(totalPrice)
                .fromCurrency(listing.getFromCurrency())
                .toCurrency(listing.getToCurrency())
                .idempotencyKey(idempotencyKey)
                .status(EscrowTransaction.EscrowStatus.PENDING)
                .build();

        return convertToEscrowDTO(escrowRepository.save(escrow));
    }

    @Transactional
    public EscrowTransactionDTO markAsPaid(Long escrowId, String proofUrl) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow not found"));

        if (escrow.getStatus() != EscrowTransaction.EscrowStatus.PENDING) {
            throw new RuntimeException("Invalid escrow status for payment");
        }

        escrow.setStatus(EscrowTransaction.EscrowStatus.PAID);
        escrow.setBuyerConfirmed(true);
        escrow.setPaymentProof(proofUrl);
        
        return convertToEscrowDTO(escrowRepository.save(escrow));
    }

    @Transactional
    public EscrowTransactionDTO releaseEscrow(Long escrowId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow not found"));

        if (escrow.getStatus() != EscrowTransaction.EscrowStatus.PAID) {
            throw new RuntimeException("Escrow must be PAID before release");
        }

        escrow.setStatus(EscrowTransaction.EscrowStatus.RELEASED);
        escrow.setSellerConfirmed(true);
        
        // Trigger wallet transfer via Kafka
        P2PEvent event = P2PEvent.builder()
                .eventType("RELEASED")
                .escrowId(escrow.getId())
                .buyerId(escrow.getBuyerId())
                .sellerId(escrow.getSellerId())
                .currencyCode(escrow.getFromCurrency())
                .amount(escrow.getAmount())
                .build();

        kafkaTemplate.send(p2pTopic, event);
        
        return convertToEscrowDTO(escrowRepository.save(escrow));
    }

    @Transactional
    public EscrowTransactionDTO disputeEscrow(Long escrowId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow not found"));
        
        escrow.setStatus(EscrowTransaction.EscrowStatus.DISPUTED);
        return convertToEscrowDTO(escrowRepository.save(escrow));
    }

    // ===================== CHAT LOGIC =====================
    public P2PMessage sendMessage(Long orderId, Long senderId, String content) {
        P2PMessage message = P2PMessage.builder()
                .orderId(orderId)
                .senderId(senderId)
                .content(content)
                .isRead(false)
                .build();
        return messageRepository.save(message);
    }

    public List<P2PMessage> getMessages(Long orderId) {
        return messageRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }

    // ===================== REVIEW LOGIC =====================
    public P2PReview leaveReview(Long orderId, Long fromUserId, Long toUserId, Integer rating, String comment) {
        EscrowTransaction escrow = escrowRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (escrow.getStatus() != EscrowTransaction.EscrowStatus.RELEASED) {
            throw new RuntimeException("Can only review completed trades");
        }

        P2PReview review = P2PReview.builder()
                .orderId(orderId)
                .fromUserId(fromUserId)
                .toUserId(toUserId)
                .rating(rating)
                .comment(comment)
                .build();
        return reviewRepository.save(review);
    }

    public List<P2PReview> getUserReviews(Long userId) {
        return reviewRepository.findByToUserId(userId);
    }

    private P2PListingDTO convertToDTO(P2PListing listing) {
        P2PListingDTO dto = new P2PListingDTO();
        dto.setId(listing.getId());
        dto.setSellerId(listing.getSellerId());
        dto.setType(listing.getType().toString());
        
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
        dto.setTotalPrice(escrow.getTotalPrice());
        dto.setFromCurrency(escrow.getFromCurrency());
        dto.setToCurrency(escrow.getToCurrency());
        dto.setStatus(escrow.getStatus().toString());
        dto.setBuyerConfirmed(escrow.isBuyerConfirmed());
        dto.setSellerConfirmed(escrow.isSellerConfirmed());
        dto.setPaymentProof(escrow.getPaymentProof());
        dto.setCreatedAt(escrow.getCreatedAt());
        dto.setUpdatedAt(escrow.getUpdatedAt());
        return dto;
    }
}
