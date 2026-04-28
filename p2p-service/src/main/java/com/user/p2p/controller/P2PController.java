package com.user.p2p.controller;

import com.user.p2p.entity.EscrowTransaction;
import com.user.p2p.entity.P2PListing;
import com.user.p2p.service.P2PService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/p2p")
public class P2PController {

    @Autowired
    private P2PService p2pService;

    @GetMapping("/listings")
    public ResponseEntity<List<P2PListing>> getActiveListings() {
        return ResponseEntity.ok(p2pService.getActiveListings());
    }

    @PostMapping("/listings")
    public ResponseEntity<P2PListing> createListing(@RequestBody P2PListing listing) {
        return ResponseEntity.ok(p2pService.createListing(listing));
    }

    @PostMapping("/escrow")
    public ResponseEntity<?> initiateEscrow(@RequestBody Map<String, Object> request) {
        try {
            Long listingId = Long.valueOf(request.get("listingId").toString());
            Long buyerId = Long.valueOf(request.get("buyerId").toString());
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String idempotencyKey = request.getOrDefault("idempotencyKey", "").toString();

            EscrowTransaction escrow = p2pService.initiateEscrow(listingId, buyerId, amount, idempotencyKey);
            return ResponseEntity.ok(escrow);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/escrow/{id}/release")
    public ResponseEntity<?> releaseEscrow(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(p2pService.releaseEscrow(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
