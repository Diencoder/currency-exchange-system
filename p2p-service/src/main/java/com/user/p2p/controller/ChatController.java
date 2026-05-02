package com.user.p2p.controller;

import com.user.p2p.entity.P2PMessage;
import com.user.p2p.service.P2PService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final P2PService p2pService;

    @MessageMapping("/chat/{orderId}")
    @SendTo("/topic/messages/{orderId}")
    public P2PMessage sendMessage(@DestinationVariable Long orderId, P2PMessage message) {
        return p2pService.sendMessage(orderId, message.getSenderId(), message.getContent());
    }
}
