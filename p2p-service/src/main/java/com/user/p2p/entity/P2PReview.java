package com.user.p2p.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "p2p_reviews")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class P2PReview extends BaseEntity {

    @Column(nullable = false)
    private Long orderId; // Refers to EscrowTransaction ID

    @Column(nullable = false)
    private Long fromUserId;

    @Column(nullable = false)
    private Long toUserId;

    @Column(nullable = false)
    private Integer rating; // 1-5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;
}
