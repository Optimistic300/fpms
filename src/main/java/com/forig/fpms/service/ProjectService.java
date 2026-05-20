package com.forig.fpms.service;

import com.forig.fpms.dto.ProjectRequest;
import com.forig.fpms.dto.ProjectResponse;
import com.forig.fpms.dto.TeamMemberResponse;
import com.forig.fpms.model.Activity;
import com.forig.fpms.model.Document;
import com.forig.fpms.model.Project;
import com.forig.fpms.model.ProjectTeam;
import com.forig.fpms.model.User;
import com.forig.fpms.repository.ActivityRepository;
import com.forig.fpms.repository.DivisionRepository;
import com.forig.fpms.repository.DocumentForwardRepository;
import com.forig.fpms.repository.DocumentRepository;
import com.forig.fpms.repository.ProjectRepository;
import com.forig.fpms.repository.ProjectTeamRepository;
import com.forig.fpms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectTeamRepository projectTeamRepository;
    private final ActivityRepository activityRepository;
    private final DocumentRepository documentRepository;
    private final DocumentForwardRepository documentForwardRepository;
    private final DivisionRepository divisionRepository;
    private final UserRepository userRepository;

    public List<ProjectResponse> getAll() {
        return projectRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<ProjectResponse> getByStatus(String status) {
        return projectRepository.findByStatus(status.toUpperCase()).stream().map(this::toResponse).toList();
    }

    public List<ProjectResponse> getByDivision(Long divisionId) {
        return projectRepository.findByDivisionId(divisionId).stream().map(this::toResponse).toList();
    }

    public ProjectResponse getById(Long id) {
        return toResponse(projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found")));
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request, User lead) {
        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status("ONGOING")
                .fundingType(request.getFundingType() != null ? request.getFundingType() : "INTERNAL")
                .researchArea(request.getResearchArea())
                .fundingSource(request.getFundingSource())
                .objectives(request.getObjectives())
                .keyFindings(request.getKeyFindings())
                .lead(lead)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        if (request.getDivisionId() != null) {
            divisionRepository.findById(request.getDivisionId()).ifPresent(project::setDivision);
        }

        projectRepository.save(project);

        projectTeamRepository.save(ProjectTeam.builder()
                .project(project)
                .user(lead)
                .role("LEAD")
                .build());

        if (request.getTeamMemberIds() != null) {
            for (Long memberId : request.getTeamMemberIds()) {
                if (memberId.equals(lead.getId())) continue;
                userRepository.findById(memberId).ifPresent(member ->
                        projectTeamRepository.save(ProjectTeam.builder()
                                .project(project)
                                .user(member)
                                .role("MEMBER")
                                .build()));
            }
        }

        return toResponse(project);
    }

    @Transactional
    public ProjectResponse update(Long projectId, ProjectRequest request, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getLead().getId().equals(user.getId())) {
            throw new RuntimeException("Only the project lead can update this project");
        }

        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setResearchArea(request.getResearchArea());
        project.setFundingSource(request.getFundingSource());
        if (request.getFundingType() != null) {
            project.setFundingType(request.getFundingType());
        }
        project.setObjectives(request.getObjectives());
        project.setKeyFindings(request.getKeyFindings());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());

        if (request.getDivisionId() != null) {
            divisionRepository.findById(request.getDivisionId()).ifPresent(project::setDivision);
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            project.setStatus(request.getStatus());
        }

        projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public void delete(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getLead().getId().equals(user.getId()) && !"MANAGEMENT".equals(user.getRole())) {
            throw new RuntimeException("Only the project lead or management can delete this project");
        }

        List<Document> allDocs = new ArrayList<>();
        allDocs.addAll(documentRepository.findByProjectId(projectId));

        List<Activity> activities = activityRepository.findByProjectId(projectId);
        for (Activity a : activities) {
            allDocs.addAll(documentRepository.findByActivityId(a.getId()));
        }

        for (Document doc : allDocs) {
            documentForwardRepository.deleteByDocumentId(doc.getId());
            try { Files.deleteIfExists(Paths.get(doc.getFileUrl())); } catch (IOException ignored) {}
        }
        documentRepository.deleteAll(allDocs);

        projectTeamRepository.deleteAll(projectTeamRepository.findByProjectId(projectId));
        activityRepository.deleteAll(activities);
        projectRepository.delete(project);
    }

    private ProjectResponse toResponse(Project project) {
        List<Activity> activities = activityRepository.findByProjectId(project.getId());

        LocalDate lastDate = activities.stream()
                .map(Activity::getActivityDate)
                .max(Comparator.naturalOrder())
                .orElse(null);

        List<TeamMemberResponse> team = projectTeamRepository.findByProjectId(project.getId())
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

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .status(project.getStatus())
                .researchArea(project.getResearchArea())
                .fundingType(project.getFundingType())
                .fundingSource(project.getFundingSource())
                .objectives(project.getObjectives())
                .keyFindings(project.getKeyFindings())
                .leadId(project.getLead().getId())
                .leadName(project.getLead().getFullName())
                .divisionId(project.getDivision() != null ? project.getDivision().getId() : null)
                .divisionName(project.getDivision() != null ? project.getDivision().getName() : null)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .activityCount(activities.size())
                .lastActivityDate(lastDate)
                .team(team)
                .build();
    }
}
