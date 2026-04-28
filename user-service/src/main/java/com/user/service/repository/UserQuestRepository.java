package com.user.service.repository;

import com.user.service.entity.UserQuest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserQuestRepository extends JpaRepository<UserQuest, Long> {
    List<UserQuest> findByUserId(Long userId);
    Optional<UserQuest> findByUserIdAndQuestId(Long userId, Long questId);
}
