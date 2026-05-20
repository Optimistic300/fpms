package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class TeamMemberResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String designation;
    private String role;
    private LocalDateTime joinedAt;
}
