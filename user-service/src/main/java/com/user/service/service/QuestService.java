package com.user.service.service;

import com.user.service.entity.Quest;
import com.user.service.entity.User;
import com.user.service.entity.UserQuest;
import com.user.service.entity.Wallet;
import com.user.service.repository.QuestRepository;
import com.user.service.repository.UserQuestRepository;
import com.user.service.repository.UserRepository;
import com.user.service.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestService {

    private final QuestRepository questRepository;
    private final UserQuestRepository userQuestRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    @Transactional
    public List<UserQuest> syncAndGetQuests(Long userId) {
        List<Quest> allQuests = questRepository.findAll();
        List<UserQuest> userQuests = userQuestRepository.findByUserId(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        for (Quest q : allQuests) {
            boolean exists = userQuests.stream().anyMatch(uq -> uq.getQuest().getId().equals(q.getId()));
            if (!exists) {
                UserQuest newUq = UserQuest.builder()
                        .userId(userId)
                        .quest(q)
                        .status(UserQuest.QuestStatus.PENDING)
                        .build();

                // Auto-complete some quests based on user state
                checkAndAutocompleteQuest(newUq, q, user);
                userQuestRepository.save(newUq);
            } else {
                UserQuest uq = userQuests.stream()
                        .filter(u -> u.getQuest().getId().equals(q.getId()))
                        .findFirst()
                        .get();
                
                if (uq.getStatus() == UserQuest.QuestStatus.PENDING) {
                    if (checkAndAutocompleteQuest(uq, q, user)) {
                        userQuestRepository.save(uq);
                    }
                }
            }
        }
        return userQuestRepository.findByUserId(userId);
    }

    private boolean checkAndAutocompleteQuest(UserQuest uq, Quest q, User user) {
        if (q.getCode().equals("WELCOME_BONUS")) {
            uq.setStatus(UserQuest.QuestStatus.COMPLETED);
            uq.setCompletedAt(LocalDateTime.now());
            return true;
        } else if (q.getCode().equals("SECURE_MASTER") && user.is2faEnabled()) {
            uq.setStatus(UserQuest.QuestStatus.COMPLETED);
            uq.setCompletedAt(LocalDateTime.now());
            return true;
        }
        return false;
    }

    @Transactional
    public void claimReward(Long userId, Long questId) {
        UserQuest uq = userQuestRepository.findByUserIdAndQuestId(userId, questId)
                .orElseThrow(() -> new RuntimeException("Quest not found for user"));

        if (uq.getStatus() != UserQuest.QuestStatus.COMPLETED) {
            throw new IllegalArgumentException("Quest is not completed yet");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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
    }
}
