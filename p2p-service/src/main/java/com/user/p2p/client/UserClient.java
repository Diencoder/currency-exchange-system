package com.user.p2p.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserResponse getUserById(@PathVariable("id") Long id);

    @Data
    class UserResponse {
        private Long id;
        private String username;
    }
}
