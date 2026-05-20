package com.forig.fpms.controller;

import com.forig.fpms.dto.DivisionResponse;
import com.forig.fpms.service.DivisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/divisions")
@RequiredArgsConstructor
public class DivisionController {

    private final DivisionService divisionService;

    @GetMapping
    public ResponseEntity<List<DivisionResponse>> getAll() {
        return ResponseEntity.ok(divisionService.getAll());
    }
}
