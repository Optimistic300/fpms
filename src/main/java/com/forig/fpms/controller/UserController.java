package com.forig.fpms.controller;

import com.forig.fpms.dto.UserResponse;
import com.forig.fpms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .map(u -> UserResponse.builder()
                                .id(u.getId())
                                .fullName(u.getFullName())
                                .role(u.getRole())
                                .designation(u.getDesignation())
                                .divisionName(u.getDivision() != null ? u.getDivision().getName() : null)
                                .build())
                        .toList()
        );
    }
}
