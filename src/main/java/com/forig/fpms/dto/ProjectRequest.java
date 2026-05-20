package com.forig.fpms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
public class ProjectRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String status;

    private String description;

    private String researchArea;

    private String fundingSource;

    private String fundingType;

    private String objectives;

    private String keyFindings;

    private Long divisionId;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<Long> teamMemberIds;
}
