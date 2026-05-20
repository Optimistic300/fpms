package com.forig.fpms.service;

import com.forig.fpms.dto.ActivityRequest;
import com.forig.fpms.dto.ActivityResponse;
import com.forig.fpms.dto.DocumentResponse;
import com.forig.fpms.model.Activity;
import com.forig.fpms.model.Document;
import com.forig.fpms.model.User;
import com.forig.fpms.repository.ActivityRepository;
import com.forig.fpms.repository.DocumentForwardRepository;
import com.forig.fpms.repository.DocumentRepository;
import com.forig.fpms.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final DocumentForwardRepository documentForwardRepository;

    public ActivityResponse create(ActivityRequest request, User user) {
        if (request.getProjectId() == null) throw new RuntimeException("Project ID is required");
        var project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Activity activity = Activity.builder()
                .user(user)
                .project(project)
                .activityType(request.getActivityType())
                .description(request.getDescription())
                .notes(request.getNotes())
                .activityDate(request.getActivityDate())
                .build();

        activityRepository.save(activity);
        return toResponse(activity);
    }

    public List<ActivityResponse> getByUser(Long userId) {
        return activityRepository.findByUserId(userId)
                .stream().map(this::toResponse).toList();
    }

    public List<ActivityResponse> getByProject(Long projectId) {
        return activityRepository.findByProjectId(projectId)
                .stream().map(this::toResponse).toList();
    }

    public List<ActivityResponse> getByDateRange(Long projectId, LocalDate start, LocalDate end) {
        return activityRepository.findByProjectIdAndActivityDateBetween(projectId, start, end)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ActivityResponse update(Long activityId, ActivityRequest request, User user) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (!activity.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Only the activity owner can edit it");
        }

        activity.setDescription(request.getDescription());
        activity.setNotes(request.getNotes());
        activity.setActivityDate(request.getActivityDate());
        if (request.getActivityType() != null) {
            activity.setActivityType(request.getActivityType());
        }

        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public void delete(Long activityId, User user) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (!activity.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Only the activity owner can delete it");
        }

        List<Document> docs = documentRepository.findByActivityId(activityId);
        for (Document doc : docs) {
            documentForwardRepository.deleteByDocumentId(doc.getId());
            try { Files.deleteIfExists(Paths.get(doc.getFileUrl())); } catch (IOException ignored) {}
        }
        documentRepository.deleteAll(docs);
        activityRepository.delete(activity);
    }

    private ActivityResponse toResponse(Activity activity) {
        List<DocumentResponse> docs = documentRepository.findByActivityId(activity.getId())
                .stream()
                .map(d -> DocumentResponse.builder()
                        .id(d.getId())
                        .fileName(d.getFileName())
                        .fileType(d.getFileType())
                        .fileSize(d.getFileSize())
                        .downloadUrl("/documents/download/" + d.getId())
                        .uploaderName(d.getUploadedBy().getFullName())
                        .libraryItem(d.isLibraryItem())
                        .createdAt(d.getCreatedAt())
                        .build())
                .toList();

        return ActivityResponse.builder()
                .id(activity.getId())
                .userId(activity.getUser().getId())
                .activityType(activity.getActivityType())
                .description(activity.getDescription())
                .notes(activity.getNotes())
                .activityDate(activity.getActivityDate())
                .projectTitle(activity.getProject().getTitle())
                .userName(activity.getUser().getFullName())
                .createdAt(activity.getCreatedAt())
                .documents(docs)
                .build();
    }
}
