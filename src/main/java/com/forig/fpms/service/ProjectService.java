package com.forig.fpms.service;

import com.forig.fpms.dto.ProjectResponse;
import com.forig.fpms.model.Activity;
import com.forig.fpms.model.Project;
import com.forig.fpms.repository.ActivityRepository;
import com.forig.fpms.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;

    public List<ProjectResponse> getAll() {
        return projectRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProjectResponse> getByStatus(String status) {
        return projectRepository.findByStatus(status.toUpperCase())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectResponse getById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return toResponse(project);
    }

    private ProjectResponse toResponse(Project project) {
        List<Activity> activities = activityRepository.findByProjectId(project.getId());

        LocalDate lastDate = activities.stream()
                .map(Activity::getActivityDate)
                .max(Comparator.naturalOrder())
                .orElse(null);

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .status(project.getStatus())
                .leadName(project.getLead().getFullName())
                .divisionName(project.getDivision() != null
                        ? project.getDivision().getName() : null)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .activityCount(activities.size())
                .lastActivityDate(lastDate)
                .build();
    }
}