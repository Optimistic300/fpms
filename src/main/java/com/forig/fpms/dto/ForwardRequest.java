package com.forig.fpms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ForwardRequest {

    @NotNull(message = "Recipient user ID is required")
    private Long forwardedToUserId;

    private String message;
}
