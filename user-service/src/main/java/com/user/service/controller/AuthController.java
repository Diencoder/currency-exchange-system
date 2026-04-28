package com.user.service.controller;

import com.user.common.dto.AuthResponse;
import com.user.common.dto.LoginRequest;
import com.user.common.dto.SignupRequest;
import com.user.service.entity.User;
import com.user.service.entity.Wallet;
import com.user.service.repository.UserRepository;
import com.user.service.repository.WalletRepository;
import com.user.service.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WalletRepository walletRepository;

    @Autowired
    com.user.service.service.WalletService walletService;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        org.springframework.security.core.userdetails.User userDetails = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).get();
        
        // Lấy ví VND mặc định của người dùng
        Wallet wallet = walletRepository.findByUserIdAndCurrencyCode(user.getId(), "VND")
                .orElse(null);

        return ResponseEntity.ok(new AuthResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                wallet != null ? wallet.getId() : null,
                wallet != null ? wallet.getCurrencyCode() : "VND",
                wallet != null ? wallet.getBalance() : java.math.BigDecimal.ZERO));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Email is already in use!");
        }

        // Create new user's account
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(signUpRequest.getRole() == null ? "ROLE_USER" : signUpRequest.getRole())
                .build();

        userRepository.save(user);
        walletService.createDefaultWallet(user);

        return ResponseEntity.ok("User registered successfully!");
    }
}
