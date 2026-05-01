package com.user.service.controller;

import com.user.service.entity.UserQuest;
import com.user.service.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;

    @GetMapping("/{userId}/quests")
    public ResponseEntity<List<UserQuest>> getUserQuests(@PathVariable Long userId) {
        return ResponseEntity.ok(questService.syncAndGetQuests(userId));
    }

    @PostMapping("/{userId}/quests/{questId}/claim")
    public ResponseEntity<?> claimReward(@PathVariable Long userId, @PathVariable Long questId) {
        questService.claimReward(userId, questId);
        return ResponseEntity.ok(Map.of("message", "Reward claimed successfully!"));
    }
}
