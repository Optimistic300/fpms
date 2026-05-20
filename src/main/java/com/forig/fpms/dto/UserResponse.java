package com.forig.fpms.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String role;
    private String designation;
    private String divisionName;
}
