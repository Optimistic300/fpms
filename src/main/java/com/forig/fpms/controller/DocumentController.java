package com.forig.fpms.controller;

import com.forig.fpms.dto.DocumentResponse;
import com.forig.fpms.dto.ForwardRequest;
import com.forig.fpms.dto.ForwardResponse;
import com.forig.fpms.model.Document;
import com.forig.fpms.model.User;
import com.forig.fpms.service.DocumentForwardService;
import com.forig.fpms.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentForwardService forwardService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "activityId", required = false) Long activityId,
            @RequestParam(value = "projectId",  required = false) Long projectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.upload(file, activityId, projectId, user));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<DocumentResponse>> getByActivity(@PathVariable Long activityId) {
        return ResponseEntity.ok(documentService.getByActivity(activityId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DocumentResponse>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(documentService.getByProject(projectId));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<DocumentResponse>> getMine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.getByUser(user.getId()));
    }

    @GetMapping("/download/{documentId}")
    public ResponseEntity<Resource> download(@PathVariable Long documentId) {
        Document doc = documentService.getDocument(documentId);
        Resource resource = documentService.getFile(documentId);
        String contentType = doc.getFileType() != null ? doc.getFileType() : "application/octet-stream";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        documentService.delete(documentId, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{documentId}/publish")
    public ResponseEntity<DocumentResponse> publish(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.publish(documentId, user));
    }

    @PutMapping("/{documentId}/unpublish")
    public ResponseEntity<Void> unpublish(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        documentService.unpublish(documentId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{documentId}/forward")
    public ResponseEntity<ForwardResponse> forward(
            @PathVariable Long documentId,
            @Valid @RequestBody ForwardRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(forwardService.forward(documentId, request, user));
    }
}
