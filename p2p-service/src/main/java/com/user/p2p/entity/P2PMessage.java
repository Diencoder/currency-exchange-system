package com.user.p2p.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "p2p_messages")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class P2PMessage extends BaseEntity {

    @Column(nullable = false)
    private Long orderId; // Refers to EscrowTransaction ID

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private boolean isRead = false;
}
