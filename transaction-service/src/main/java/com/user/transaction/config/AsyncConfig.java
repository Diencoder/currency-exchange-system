package com.user.transaction.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuration for Multithreading in Spring Boot.
 * This enables the @Async annotation and defines a managed Thread Pool.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Cấu hình số lượng luồng (Threads)
        executor.setCorePoolSize(5);      // Số luồng tối thiểu luôn chạy
        executor.setMaxPoolSize(10);     // Số luồng tối đa khi hàng đợi đầy
        executor.setQueueCapacity(100);  // Hàng đợi chứa các tác vụ chờ xử lý
        
        executor.setThreadNamePrefix("CurrencyAsync-"); // Tiền tố tên luồng để dễ debug
        executor.initialize();
        
        return executor;
    }
}
