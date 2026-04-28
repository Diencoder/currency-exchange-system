package com.user.service.config;

import com.user.service.entity.Quest;
import com.user.service.repository.QuestRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initQuests(QuestRepository questRepository) {
        return args -> {
            if (questRepository.count() == 0) {
                questRepository.save(Quest.builder()
                        .code("WELCOME_BONUS")
                        .name("Welcome Bonus")
                        .description("Tặng thưởng khi đăng kí tài khoản mới")
                        .rewardAmount(new BigDecimal("10.00"))
                        .rewardCurrency("USD")
                        .build());

                questRepository.save(Quest.builder()
                        .code("SECURE_MASTER")
                        .name("Security Master")
                        .description("Bảo vệ tài khoản bằng cách kích hoạt 2FA")
                        .rewardAmount(new BigDecimal("5.00"))
                        .rewardCurrency("USD")
                        .build());
                
                System.out.println(">>> Quests initialized successfully!");
            }
        };
    }
}
