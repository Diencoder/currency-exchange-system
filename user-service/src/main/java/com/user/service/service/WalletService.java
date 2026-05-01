package com.user.service.service;

import com.user.common.dto.WalletDTO;
import com.user.service.entity.User;
import com.user.service.entity.Wallet;
import com.user.service.repository.UserRepository;
import com.user.service.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.user.service.exception.InsufficientBalanceException;
import com.user.service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createDefaultWallet(User user) {
        Wallet vndWallet = Wallet.builder()
                .user(user)
                .currencyCode("VND")
                .balance(BigDecimal.ZERO)
                .lockedBalance(BigDecimal.ZERO)
                .build();
        walletRepository.save(vndWallet);
    }

    public List<WalletDTO> getWalletsByUserId(Long userId) {
        return walletRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WalletDTO deposit(Long userId, String currencyCode, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Wallet wallet = walletRepository.findByUserIdAndCurrencyCode(userId, currencyCode)
                .orElseGet(() -> Wallet.builder()
                        .user(user)
                        .currencyCode(currencyCode)
                        .balance(BigDecimal.ZERO)
                        .lockedBalance(BigDecimal.ZERO)
                        .build());

        wallet.setBalance(wallet.getBalance().add(amount));
        return convertToDTO(walletRepository.save(wallet));
    }

    @Transactional
    public void transferP2P(Long sellerId, Long buyerId, String currencyCode, BigDecimal amount) {
        Wallet sellerWallet = walletRepository.findByUserIdAndCurrencyCode(sellerId, currencyCode)
                .orElseThrow(() -> new ResourceNotFoundException("Seller wallet not found for " + currencyCode));
        
        Wallet buyerWallet = walletRepository.findByUserIdAndCurrencyCode(buyerId, currencyCode)
                .orElseGet(() -> {
                    User buyer = userRepository.findById(buyerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Buyer user not found: " + buyerId));
                    return Wallet.builder()
                            .user(buyer)
                            .currencyCode(currencyCode)
                            .balance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .build();
                });

        if (sellerWallet.getLockedBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Seller " + sellerId + " has insufficient locked balance: " + amount);
        }

        // Subtract from seller's locked balance
        sellerWallet.setLockedBalance(sellerWallet.getLockedBalance().subtract(amount));
        
        // Add to buyer's available balance
        buyerWallet.setBalance(buyerWallet.getBalance().add(amount));

        walletRepository.save(sellerWallet);
        walletRepository.save(buyerWallet);
    }

    private WalletDTO convertToDTO(Wallet wallet) {
        return WalletDTO.builder()
                .id(wallet.getId())
                .userId(wallet.getUser().getId())
                .currencyCode(wallet.getCurrencyCode())
                .balance(wallet.getBalance())
                .lockedBalance(wallet.getLockedBalance())
                .version(wallet.getVersion())
                .build();
    }
}
