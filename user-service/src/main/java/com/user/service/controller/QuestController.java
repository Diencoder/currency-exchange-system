package com.user.service.controller;

import com.user.service.entity.Quest;
import com.user.service.entity.User;
import com.user.service.entity.UserQuest;
import com.user.service.entity.Wallet;
import com.user.service.repository.QuestRepository;
import com.user.service.repository.UserQuestRepository;
import com.user.service.repository.UserRepository;
import com.user.service.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class QuestController {

    @Autowired
    private QuestRepository questRepository;

    @Autowired
    private UserQuestRepository userQuestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @GetMapping("/{userId}/quests")
    public ResponseEntity<List<UserQuest>> getUserQuests(@PathVariable Long userId) {
        // Sync quests logic: if a user doesn't have a quest assigned, assign it
        List<Quest> allQuests = questRepository.findAll();
        List<UserQuest> userQuests = userQuestRepository.findByUserId(userId);
        
        User user = userRepository.findById(userId).orElseThrow();

        for (Quest q : allQuests) {
            boolean exists = userQuests.stream().anyMatch(uq -> uq.getQuest().getId().equals(q.getId()));
            if (!exists) {
                UserQuest newUq = UserQuest.builder()
                        .userId(userId)
                        .quest(q)
                        .status(UserQuest.QuestStatus.PENDING)
                        .build();
                
                // Auto-complete some quests based on user state
                if (q.getCode().equals("WELCOME_BONUS")) {
                    newUq.setStatus(UserQuest.QuestStatus.COMPLETED);
                    newUq.setCompletedAt(LocalDateTime.now());
                } else if (q.getCode().equals("SECURE_MASTER") && user.is2faEnabled()) {
                    newUq.setStatus(UserQuest.QuestStatus.COMPLETED);
                    newUq.setCompletedAt(LocalDateTime.now());
                }
                
                userQuestRepository.save(newUq);
            } else {
                // Check if quest can now be marked as COMPLETED
                UserQuest uq = userQuests.stream().filter(u -> u.getQuest().getId().equals(q.getId())).findFirst().get();
                if (uq.getStatus() == UserQuest.QuestStatus.PENDING) {
                   if (q.getCode().equals("SECURE_MASTER") && user.is2faEnabled()) {
                       uq.setStatus(UserQuest.QuestStatus.COMPLETED);
                       uq.setCompletedAt(LocalDateTime.now());
                       userQuestRepository.save(uq);
                   }
                }
            }
        }
        
        return ResponseEntity.ok(userQuestRepository.findByUserId(userId));
    }

    @PostMapping("/{userId}/quests/{questId}/claim")
    public ResponseEntity<?> claimReward(@PathVariable Long userId, @PathVariable Long questId) {
        UserQuest uq = userQuestRepository.findByUserIdAndQuestId(userId, questId)
                .orElseThrow(() -> new RuntimeException("Quest not found for user"));

        if (uq.getStatus() != UserQuest.QuestStatus.COMPLETED) {
            return ResponseEntity.badRequest().body(Map.of("error", "Quest is not completed yet"));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Credit reward to wallet
        Quest quest = uq.getQuest();
        Wallet wallet = walletRepository.findByUserIdAndCurrencyCode(userId, quest.getRewardCurrency())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(user)
                            .currencyCode(quest.getRewardCurrency())
                            .balance(java.math.BigDecimal.ZERO)
                            .build();
                    return walletRepository.save(w);
                });

        wallet.setBalance(wallet.getBalance().add(quest.getRewardAmount()));
        walletRepository.save(wallet);

        uq.setStatus(UserQuest.QuestStatus.CLAIMED);
        uq.setClaimedAt(LocalDateTime.now());
        userQuestRepository.save(uq);

        return ResponseEntity.ok(Map.of(
            "message", "Reward claimed successfully!",
            "amount", quest.getRewardAmount(),
            "currency", quest.getRewardCurrency()
        ));
    }
}
