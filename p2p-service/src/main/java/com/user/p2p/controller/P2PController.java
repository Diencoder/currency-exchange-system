package com.user.p2p.controller;

import com.user.p2p.dto.EscrowRequest;
import com.user.p2p.dto.EscrowTransactionDTO;
import com.user.p2p.dto.P2PListingDTO;
import com.user.p2p.dto.P2PListingRequest;
import com.user.p2p.entity.P2PMessage;
import com.user.p2p.entity.P2PReview;
import com.user.p2p.service.P2PService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/p2p")
@RequiredArgsConstructor
public class P2PController {

    private final P2PService p2pService;

    @GetMapping("/listings")
    public ResponseEntity<List<P2PListingDTO>> getActiveListings(@RequestParam(defaultValue = "BUY") String type) {
        return ResponseEntity.ok(p2pService.getActiveListings(type));
    }

    @PostMapping("/listings")
    public ResponseEntity<P2PListingDTO> createListing(@RequestBody P2PListingRequest request) {
        return ResponseEntity.ok(p2pService.createListing(request));
    }

    @PostMapping("/escrow")
    public ResponseEntity<EscrowTransactionDTO> initiateEscrow(@RequestBody EscrowRequest request) {
        return ResponseEntity.ok(p2pService.initiateEscrow(
                request.getListingId(),
                request.getBuyerId(),
                request.getAmount(),
                request.getIdempotencyKey()
        ));
    }

    @PostMapping("/escrow/{id}/pay")
    public ResponseEntity<EscrowTransactionDTO> markAsPaid(@PathVariable Long id, @RequestParam(required = false) String proofUrl) {
        return ResponseEntity.ok(p2pService.markAsPaid(id, proofUrl));
    }

    @PostMapping("/escrow/{id}/release")
    public ResponseEntity<EscrowTransactionDTO> releaseEscrow(@PathVariable Long id) {
        return ResponseEntity.ok(p2pService.releaseEscrow(id));
    }

    @PostMapping("/escrow/{id}/dispute")
    public ResponseEntity<EscrowTransactionDTO> disputeEscrow(@PathVariable Long id) {
        return ResponseEntity.ok(p2pService.disputeEscrow(id));
    }

    // ===================== CHAT ENDPOINTS =====================
    @GetMapping("/escrow/{id}/messages")
    public ResponseEntity<List<P2PMessage>> getMessages(@PathVariable Long id) {
        return ResponseEntity.ok(p2pService.getMessages(id));
    }

    @PostMapping("/escrow/{id}/messages")
    public ResponseEntity<P2PMessage> sendMessage(@PathVariable Long id, @RequestParam Long senderId, @RequestBody String content) {
        return ResponseEntity.ok(p2pService.sendMessage(id, senderId, content));
    }

    // ===================== REVIEW ENDPOINTS =====================
    @PostMapping("/escrow/{id}/reviews")
    public ResponseEntity<P2PReview> leaveReview(
            @PathVariable Long id,
            @RequestParam Long fromUserId,
            @RequestParam Long toUserId,
            @RequestParam Integer rating,
            @RequestBody(required = false) String comment) {
        return ResponseEntity.ok(p2pService.leaveReview(id, fromUserId, toUserId, rating, comment));
    }

    @GetMapping("/users/{id}/reviews")
    public ResponseEntity<List<P2PReview>> getUserReviews(@PathVariable Long id) {
        return ResponseEntity.ok(p2pService.getUserReviews(id));
    }

    @PutMapping("/listings/{id}/price")
    public ResponseEntity<P2PListingDTO> updatePrice(@PathVariable Long id, @RequestParam Long sellerId, @RequestParam java.math.BigDecimal price) {
        return ResponseEntity.ok(p2pService.updateListingPrice(id, sellerId, price));
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Void> cancelListing(@PathVariable Long id, @RequestParam Long sellerId) {
        p2pService.cancelListing(id, sellerId);
        return ResponseEntity.noContent().build();
    }
}
