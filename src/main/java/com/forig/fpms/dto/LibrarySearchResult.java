package com.forig.fpms.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class LibrarySearchResult {
    private Long id;
    private String fileName;
    private String fileType;
    private String downloadUrl;
    private String projectTitle;
    private String uploaderName;
    private String divisionName;
    private String snippet;
}
