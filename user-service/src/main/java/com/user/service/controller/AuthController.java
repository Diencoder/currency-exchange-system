package com.user.service.controller;

import com.user.common.dto.LoginRequest;
import com.user.common.dto.SignupRequest;
import com.user.service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(userService.authenticateUser(loginRequest));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        userService.registerUser(signUpRequest);
        return ResponseEntity.ok("User registered successfully!");
    }
}
