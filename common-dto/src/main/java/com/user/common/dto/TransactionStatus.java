package com.user.common.dto;

public enum TransactionStatus {
    CREATED,    // Initial offer created by seller
    PROCESSING, // System is handling funds/validation
    LOCKED,     // Buyer accepted, seller's funds held in escrow
    PAID,       // Buyer marked as paid
    CONFIRMED,  // Seller confirmed receipt of payment
    COMPLETED,  // System released funds to buyer
    CANCELLED,  // Transaction aborted
    FAILED      // Transaction failed due to error
}
