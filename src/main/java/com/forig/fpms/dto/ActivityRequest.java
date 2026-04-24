package com.forig.fpms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class ActivityRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private String activityType;

    @NotBlank(message = "Description is required")
    private String description;

    private String notes;

    @NotNull(message = "Activity date is required")
    private LocalDate activityDate;
}