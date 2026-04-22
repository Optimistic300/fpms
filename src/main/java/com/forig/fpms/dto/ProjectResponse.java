package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class ProjectResponse {

    private Long id;
    private String title;
    private String description;
    private String status;
    private String leadName;
    private String divisionName;
    private LocalDate startDate;
    private LocalDate endDate;
    private long activityCount;
    private LocalDate lastActivityDate;
}