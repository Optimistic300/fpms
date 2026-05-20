package com.forig.fpms.controller;

import com.forig.fpms.dto.ProjectRequest;
import com.forig.fpms.dto.ProjectResponse;
import com.forig.fpms.dto.TeamMemberResponse;
import com.forig.fpms.model.User;
import com.forig.fpms.repository.ProjectTeamRepository;
import com.forig.fpms.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectTeamRepository projectTeamRepository;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAll() {
        return ResponseEntity.ok(projectService.getAll());
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.create(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        projectService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProjectResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(projectService.getByStatus(status));
    }

    @GetMapping("/division/{divisionId}")
    public ResponseEntity<List<ProjectResponse>> getByDivision(@PathVariable Long divisionId) {
        return ResponseEntity.ok(projectService.getByDivision(divisionId));
    }

    @GetMapping("/{id}/team")
    public ResponseEntity<List<TeamMemberResponse>> getTeam(@PathVariable Long id) {
        List<TeamMemberResponse> team = projectTeamRepository.findByProjectId(id)
                .stream()
                .map(pt -> TeamMemberResponse.builder()
                        .id(pt.getId())
                        .userId(pt.getUser().getId())
                        .fullName(pt.getUser().getFullName())
                        .designation(pt.getUser().getDesignation())
                        .role(pt.getRole())
                        .joinedAt(pt.getJoinedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(team);
    }
}
