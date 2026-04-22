package com.forig.fpms.service;

import com.forig.fpms.dto.ActivityRequest;
import com.forig.fpms.dto.ActivityResponse;
import com.forig.fpms.model.Activity;
import com.forig.fpms.model.User;
import com.forig.fpms.repository.ActivityRepository;
import com.forig.fpms.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ProjectRepository projectRepository;

    public ActivityResponse create(ActivityRequest request, User user) {
        var project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Activity activity = Activity.builder()
                .user(user)
                .project(project)
                .description(request.getDescription())
                .notes(request.getNotes())
                .activityDate(request.getActivityDate())
                .build();

        activityRepository.save(activity);

        return toResponse(activity);
    }

    public List<ActivityResponse> getByUser(Long userId) {
        return activityRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ActivityResponse> getByProject(Long projectId) {
        return activityRepository.findByProjectId(projectId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ActivityResponse> getByDateRange(Long projectId, LocalDate start, LocalDate end) {
        return activityRepository.findByProjectIdAndActivityDateBetween(projectId, start, end)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ActivityResponse toResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .description(activity.getDescription())
                .notes(activity.getNotes())
                .activityDate(activity.getActivityDate())
                .projectTitle(activity.getProject().getTitle())
                .userName(activity.getUser().getFullName())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}