package com.user.common.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletDTO {
    private Long id;
    private Long userId;
    private String currencyCode;
    private BigDecimal balance;
    private BigDecimal lockedBalance;
    private Long version;
}
