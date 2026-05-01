package com.user.p2p;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class P2PServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(P2PServiceApplication.class, args);
    }
}
