package com.user.service.service;

import com.user.common.dto.AuthResponse;
import com.user.common.dto.LoginRequest;
import com.user.common.dto.SignupRequest;
import com.user.service.entity.User;
import com.user.service.entity.Wallet;
import com.user.service.repository.UserRepository;
import com.user.service.repository.WalletRepository;
import com.user.service.security.JwtUtils;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        org.springframework.security.core.userdetails.User userDetails = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Wallet wallet = walletRepository.findByUserIdAndCurrencyCode(user.getId(), "VND")
                .orElse(null);

        return new AuthResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                wallet != null ? wallet.getId() : null,
                wallet != null ? wallet.getCurrencyCode() : "VND",
                wallet != null ? wallet.getBalance() : BigDecimal.ZERO);
    }

    @Transactional
    public void registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(signUpRequest.getRole() == null ? "ROLE_USER" : signUpRequest.getRole())
                .build();

        userRepository.save(user);
        walletService.createDefaultWallet(user);
    }

    @Transactional
    public Map<String, Object> generate2FA(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        final GoogleAuthenticatorKey key = gAuth.createCredentials();
        user.setTwoFaSecret(key.getKey());
        user.set2faEnabled(true);
        userRepository.save(user);

        String otpAuthUrl = String.format("otpauth://totp/BinancePro:%s?secret=%s&issuer=BinancePro",
                user.getUsername(), key.getKey());

        return Map.of(
                "secret", key.getKey(),
                "otpAuthUrl", otpAuthUrl
        );
    }

    public boolean verify2FA(Long id, int code) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.is2faEnabled() || user.getTwoFaSecret() == null) {
            throw new RuntimeException("2FA not enabled");
        }

        return gAuth.authorize(user.getTwoFaSecret(), code);
    }
}
