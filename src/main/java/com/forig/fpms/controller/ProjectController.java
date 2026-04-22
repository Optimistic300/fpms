package com.forig.fpms.controller;

import com.forig.fpms.dto.ProjectResponse;
import com.forig.fpms.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAll() {
        return ResponseEntity.ok(projectService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProjectResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(projectService.getByStatus(status));
    }
}