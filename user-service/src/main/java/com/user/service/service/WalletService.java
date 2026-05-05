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
        // Create or Update VND Wallet with 100M
        Wallet vndWallet = walletRepository.findByUserIdAndCurrencyCode(user.getId(), "VND")
                .orElse(Wallet.builder().user(user).currencyCode("VND").lockedBalance(BigDecimal.ZERO).build());
        if (vndWallet.getBalance() == null || vndWallet.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            vndWallet.setBalance(new BigDecimal("100000000.00"));
            walletRepository.save(vndWallet);
        }

        // Create or Update USD Wallet with 5k
        Wallet usdWallet = walletRepository.findByUserIdAndCurrencyCode(user.getId(), "USD")
                .orElse(Wallet.builder().user(user).currencyCode("USD").lockedBalance(BigDecimal.ZERO).build());
        if (usdWallet.getBalance() == null || usdWallet.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            usdWallet.setBalance(new BigDecimal("5000.00"));
            walletRepository.save(usdWallet);
        }
    }

    public List<WalletDTO> getWalletsByUserId(Long userId) {
        List<Wallet> wallets = walletRepository.findByUserId(userId);
        
        // If user has no wallets or zero balances, ensure they get initial funds
        boolean hasZeroVnd = wallets.stream().anyMatch(w -> w.getCurrencyCode().equals("VND") && w.getBalance().compareTo(BigDecimal.ZERO) <= 0);
        
        if (wallets.isEmpty() || hasZeroVnd) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            createDefaultWallet(user);
            wallets = walletRepository.findByUserId(userId);
        }
        
        return wallets.stream()
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
