package com.forig.fpms.controller;

import com.forig.fpms.dto.ActivityRequest;
import com.forig.fpms.dto.ActivityResponse;
import com.forig.fpms.model.User;
import com.forig.fpms.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ActivityResponse> create(
            @Valid @RequestBody ActivityRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(activityService.create(request, user));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ActivityResponse>> mine(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(activityService.getByUser(user.getId()));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ActivityResponse>> byProject(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(activityService.getByProject(projectId));
    }

    @GetMapping("/report")
    public ResponseEntity<List<ActivityResponse>> report(
            @RequestParam Long projectId,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(activityService.getByDateRange(projectId, start, end));
    }
}