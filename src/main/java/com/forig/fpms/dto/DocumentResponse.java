package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class DocumentResponse {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;
    private Long projectId;
    private String projectTitle;
    private String researchArea;
    private Long activityId;
    private String uploaderName;
    private String divisionName;
    private boolean libraryItem;
    private LocalDateTime createdAt;
}
