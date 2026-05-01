package com.user.service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private String role; // e.g., ROLE_USER, ROLE_ADMIN

    @Column(name = "kyc_status")
    @Builder.Default
    private String kycStatus = "UNVERIFIED";

    @Column(name = "is_2fa_enabled")
    @Builder.Default
    private boolean is2faEnabled = false;

    @Column(name = "two_fa_secret")
    private String twoFaSecret;
}
