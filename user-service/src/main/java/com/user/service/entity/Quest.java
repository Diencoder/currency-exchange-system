package com.user.service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "quests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // e.g., WELCOME_BONUS, SECURE_MASTER

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "reward_amount", nullable = false)
    private BigDecimal rewardAmount;

    @Column(name = "reward_currency")
    @Builder.Default
    private String rewardCurrency = "USD";
}
