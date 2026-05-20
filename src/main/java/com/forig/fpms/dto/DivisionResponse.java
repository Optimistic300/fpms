package com.forig.fpms.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DivisionResponse {
    private Long id;
    private String name;
    private String description;
}
