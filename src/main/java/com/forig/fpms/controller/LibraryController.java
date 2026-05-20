package com.forig.fpms.controller;

import com.forig.fpms.dto.DocumentResponse;
import com.forig.fpms.dto.LibrarySearchRequest;
import com.forig.fpms.dto.LibrarySearchResult;
import com.forig.fpms.dto.LibraryStats;
import com.forig.fpms.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class LibraryController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getLibrary(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long divisionId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String researchArea) {
        return ResponseEntity.ok(documentService.getLibrary(search, divisionId, projectId, researchArea));
    }

    @PostMapping("/search")
    public ResponseEntity<List<LibrarySearchResult>> search(
            @Valid @RequestBody LibrarySearchRequest request) {
        return ResponseEntity.ok(documentService.searchLibrary(request.getQuery()));
    }

    @GetMapping("/stats")
    public ResponseEntity<LibraryStats> getStats() {
        return ResponseEntity.ok(documentService.getStats());
    }
}
