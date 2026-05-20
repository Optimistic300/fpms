package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class ActivityResponse {

    private Long id;
    private Long userId;
    private String activityType;
    private String description;
    private String notes;
    private LocalDate activityDate;
    private String projectTitle;
    private String userName;
    private LocalDateTime createdAt;
    private List<DocumentResponse> documents;
}
