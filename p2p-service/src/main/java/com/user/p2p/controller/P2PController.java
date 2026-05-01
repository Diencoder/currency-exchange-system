package com.user.p2p.controller;

import com.user.p2p.dto.EscrowRequest;
import com.user.p2p.dto.EscrowTransactionDTO;
import com.user.p2p.dto.P2PListingDTO;
import com.user.p2p.dto.P2PListingRequest;
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
    public ResponseEntity<List<P2PListingDTO>> getActiveListings() {
        return ResponseEntity.ok(p2pService.getActiveListings());
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

    @PostMapping("/escrow/{id}/release")
    public ResponseEntity<EscrowTransactionDTO> releaseEscrow(@PathVariable Long id) {
        return ResponseEntity.ok(p2pService.releaseEscrow(id));
    }
}
