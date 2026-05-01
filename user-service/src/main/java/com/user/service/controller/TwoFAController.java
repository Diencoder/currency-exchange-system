package com.user.service.controller;

import com.user.service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class TwoFAController {

    private final UserService userService;

    @PostMapping("/{id}/2fa/generate")
    public ResponseEntity<?> generate2FA(@PathVariable Long id) {
        return ResponseEntity.ok(userService.generate2FA(id));
    }

    @PostMapping("/{id}/2fa/verify")
    public ResponseEntity<?> verify2FA(@PathVariable Long id, @RequestParam int code) {
        boolean isCodeValid = userService.verify2FA(id, code);
        return ResponseEntity.ok(Map.of("valid", isCodeValid));
    }
}
