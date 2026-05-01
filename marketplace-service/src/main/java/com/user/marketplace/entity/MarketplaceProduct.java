package com.user.marketplace.entity;

import com.user.service.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entity representing a digital product in the Discovery Marketplace.
 */
@Entity
@Table(name = "marketplace_products")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceProduct extends BaseEntity {

    private String name;
    
    private String description;
    
    private BigDecimal price;
    
    private String currency; // VND, USD, etc.
    
    private String category; // STREAMING, DESIGN, GAMING
    
    private Long sellerId;
    
    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    public enum ProductStatus {
        AVAILABLE, SOLD, DELETED
    }
}
