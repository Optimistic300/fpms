package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class ProjectResponse {

    private Long id;
    private String title;
    private String description;
    private String status;
    private String researchArea;
    private String fundingType;
    private String fundingSource;
    private String objectives;
    private String keyFindings;
    private Long leadId;
    private String leadName;
    private Long divisionId;
    private String divisionName;
    private LocalDate startDate;
    private LocalDate endDate;
    private long activityCount;
    private LocalDate lastActivityDate;
    private List<TeamMemberResponse> team;
}
