package com.forig.fpms.controller;

import com.forig.fpms.dto.ForwardResponse;
import com.forig.fpms.model.User;
import com.forig.fpms.service.DocumentForwardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forwards")
@RequiredArgsConstructor
public class ForwardController {

    private final DocumentForwardService forwardService;

    @GetMapping("/inbox")
    public ResponseEntity<List<ForwardResponse>> getInbox(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(forwardService.getInbox(user.getId()));
    }

    @GetMapping("/inbox/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("count", forwardService.getUnreadCount(user.getId())));
    }

    @PutMapping("/{forwardId}/read")
    public ResponseEntity<ForwardResponse> markRead(
            @PathVariable Long forwardId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(forwardService.markRead(forwardId, user));
    }
}
