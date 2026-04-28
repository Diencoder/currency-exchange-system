package com.user.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String role;
    private Long walletId;
    private String currencyCode;
    private java.math.BigDecimal balance;

    public AuthResponse(String token, Long id, String username, String email, String role, Long walletId, String currencyCode, java.math.BigDecimal balance) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.walletId = walletId;
        this.currencyCode = currencyCode;
        this.balance = balance;
    }
}
