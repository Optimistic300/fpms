package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class ActivityResponse {

    private Long id;
    private String activityType;
    private String description;
    private String notes;
    private LocalDate activityDate;
    private String projectTitle;
    private String userName;
    private LocalDateTime createdAt;
}