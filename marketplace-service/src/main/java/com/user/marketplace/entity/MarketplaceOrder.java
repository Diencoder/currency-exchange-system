package com.user.marketplace.entity;

import com.user.service.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entity representing an Order in the Marketplace with Escrow status.
 */
@Entity
@Table(name = "marketplace_orders")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceOrder extends BaseEntity {

    private Long productId;
    
    private Long buyerId;
    
    private Long sellerId;
    
    private BigDecimal amount;
    
    private String currency;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    public enum OrderStatus {
        PENDING_PAYMENT, // Khách chưa trả tiền
        PAID_LOCKED,      // Tiền đã bị khóa (Escrow - Sàn giữ)
        COMPLETED,        // Giao dịch thành công (Tiền về túi người bán)
        DISPUTED,         // Có khiếu nại (Admin đang xử lý)
        CANCELLED         // Hủy đơn
    }
}
