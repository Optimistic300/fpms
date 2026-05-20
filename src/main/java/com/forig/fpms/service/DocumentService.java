package com.forig.fpms.service;

import com.forig.fpms.dto.DocumentResponse;
import com.forig.fpms.dto.LibrarySearchResult;
import com.forig.fpms.dto.LibraryStats;
import com.forig.fpms.model.Document;
import com.forig.fpms.model.User;
import com.forig.fpms.repository.ActivityRepository;
import com.forig.fpms.repository.DocumentRepository;
import com.forig.fpms.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "image/png",
            "image/jpeg"
    );

    private final DocumentRepository documentRepository;
    private final ActivityRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final TextExtractorService textExtractorService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public DocumentResponse upload(MultipartFile file, Long activityId, Long projectId, User user) {
        if (activityId == null && projectId == null) {
            throw new RuntimeException("Either activityId or projectId must be provided");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("File type not allowed");
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new RuntimeException("File exceeds 10 MB limit");
        }

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String stored = UUID.randomUUID() + "_" + original;

        String subDir = activityId != null ? "activities/" + activityId : "projects/" + projectId;
        Path dir = Paths.get(uploadDir, subDir);
        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }

        String extractedText = textExtractorService.extract(file, contentType);

        Document.DocumentBuilder builder = Document.builder()
                .fileName(original)
                .fileUrl(dir.resolve(stored).toString())
                .fileType(contentType)
                .fileSize(file.getSize())
                .uploadedBy(user)
                .libraryItem(false)
                .extractedText(extractedText);

        if (activityId != null) {
            activityRepository.findById(activityId)
                    .ifPresent(builder::activity);
        }
        if (projectId != null) {
            projectRepository.findById(projectId)
                    .ifPresent(builder::project);
        }

        return toResponse(documentRepository.save(builder.build()));
    }

    public List<DocumentResponse> getByActivity(Long activityId) {
        return documentRepository.findByActivityId(activityId)
                .stream().map(this::toResponse).toList();
    }

    public List<DocumentResponse> getByProject(Long projectId) {
        return documentRepository.findByProjectId(projectId)
                .stream().map(this::toResponse).toList();
    }

    public List<DocumentResponse> getByUser(Long userId) {
        return documentRepository.findByUploadedByIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    public Resource getFile(Long documentId) {
        Document doc = getDocument(documentId);
        Path path = Paths.get(doc.getFileUrl());
        Resource resource = new FileSystemResource(path);
        if (!resource.exists()) throw new RuntimeException("File not found on disk");
        return resource;
    }

    public Document getDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public void delete(Long documentId, User user) {
        Document doc = getDocument(documentId);
        if (!doc.getUploadedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this document");
        }
        try { Files.deleteIfExists(Paths.get(doc.getFileUrl())); } catch (IOException ignored) {}
        documentRepository.delete(doc);
    }

    public DocumentResponse publish(Long documentId, User user) {
        Document doc = getDocument(documentId);
        if (!doc.getUploadedBy().getId().equals(user.getId()) && !"MANAGEMENT".equals(user.getRole())) {
            throw new RuntimeException("Not authorized to publish this document");
        }
        doc.setLibraryItem(true);
        return toResponse(documentRepository.save(doc));
    }

    public void unpublish(Long documentId, User user) {
        Document doc = getDocument(documentId);
        if (!doc.getUploadedBy().getId().equals(user.getId()) && !"MANAGEMENT".equals(user.getRole())) {
            throw new RuntimeException("Not authorized to unpublish this document");
        }
        doc.setLibraryItem(false);
        documentRepository.save(doc);
    }

    public List<DocumentResponse> getLibrary(String search, Long divisionId, Long projectId, String researchArea) {
        String s = (search != null && search.isBlank()) ? null : search;
        String ra = (researchArea != null && researchArea.isBlank()) ? null : researchArea;
        return documentRepository.findLibraryItems(s, divisionId, projectId, ra)
                .stream().map(this::toResponse).toList();
    }

    public List<LibrarySearchResult> searchLibrary(String query) {
        String sql = """
                SELECT d.id, d.file_name, d.file_type,
                       u.full_name AS uploader_name,
                       p.title     AS project_title,
                       div.name    AS division_name,
                       ts_headline('english',
                           coalesce(d.extracted_text,''),
                           plainto_tsquery('english', ?),
                           'MaxWords=50,MinWords=20,ShortWord=3') AS snippet
                FROM documents d
                LEFT JOIN users     u   ON u.id   = d.uploaded_by
                LEFT JOIN projects  p   ON p.id   = d.project_id
                LEFT JOIN divisions div ON div.id = p.division_id
                WHERE d.is_library_item = true
                  AND d.extracted_text IS NOT NULL
                  AND d.extracted_text <> ''
                  AND to_tsvector('english', d.extracted_text) @@ plainto_tsquery('english', ?)
                ORDER BY ts_rank(to_tsvector('english', d.extracted_text),
                                 plainto_tsquery('english', ?)) DESC
                LIMIT 20
                """;

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> LibrarySearchResult.builder()
                        .id(rs.getLong("id"))
                        .fileName(rs.getString("file_name"))
                        .fileType(rs.getString("file_type"))
                        .downloadUrl("/documents/download/" + rs.getLong("id"))
                        .projectTitle(rs.getString("project_title"))
                        .uploaderName(rs.getString("uploader_name"))
                        .divisionName(rs.getString("division_name"))
                        .snippet(rs.getString("snippet"))
                        .build(),
                query, query, query);
    }

    public LibraryStats getStats() {
        List<Document> docs = documentRepository.findByLibraryItemTrueOrderByCreatedAtDesc();

        Map<String, Long> byDivision = docs.stream()
                .filter(d -> d.getProject() != null && d.getProject().getDivision() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getProject().getDivision().getName(), Collectors.counting()));

        Map<String, Long> byFunding = docs.stream()
                .filter(d -> d.getProject() != null && d.getProject().getFundingType() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getProject().getFundingType(), Collectors.counting()));

        Map<String, Long> byType = docs.stream()
                .filter(d -> d.getFileType() != null)
                .collect(Collectors.groupingBy(d -> {
                    String t = d.getFileType();
                    return t.contains("/") ? t.substring(t.lastIndexOf('/') + 1) : t;
                }, Collectors.counting()));

        return LibraryStats.builder()
                .total(docs.size())
                .byDivision(byDivision.entrySet().stream()
                        .map(e -> new LibraryStats.StatItem(e.getKey(), e.getValue())).toList())
                .byFundingType(byFunding.entrySet().stream()
                        .map(e -> new LibraryStats.StatItem(e.getKey(), e.getValue())).toList())
                .byFileType(byType.entrySet().stream()
                        .map(e -> new LibraryStats.StatItem(e.getKey(), e.getValue())).toList())
                .build();
    }

    public DocumentResponse toResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .downloadUrl("/documents/download/" + doc.getId())
                .projectId(doc.getProject() != null ? doc.getProject().getId() : null)
                .projectTitle(doc.getProject() != null ? doc.getProject().getTitle() : null)
                .researchArea(doc.getProject() != null ? doc.getProject().getResearchArea() : null)
                .activityId(doc.getActivity() != null ? doc.getActivity().getId() : null)
                .uploaderName(doc.getUploadedBy().getFullName())
                .divisionName(doc.getProject() != null && doc.getProject().getDivision() != null
                        ? doc.getProject().getDivision().getName() : null)
                .libraryItem(doc.isLibraryItem())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
