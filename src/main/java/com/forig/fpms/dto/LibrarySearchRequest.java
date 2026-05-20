package com.forig.fpms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LibrarySearchRequest {

    @NotBlank(message = "Search query is required")
    private String query;
}
