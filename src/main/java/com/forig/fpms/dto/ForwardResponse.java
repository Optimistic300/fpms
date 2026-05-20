package com.forig.fpms.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class ForwardResponse {
    private Long id;
    private DocumentResponse document;
    private String forwardedByName;
    private String forwardedToName;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
