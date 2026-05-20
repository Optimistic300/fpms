package com.forig.fpms.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class LibraryStats {

    private long total;
    private List<StatItem> byDivision;
    private List<StatItem> byFundingType;
    private List<StatItem> byFileType;

    @Getter @AllArgsConstructor
    public static class StatItem {
        private String name;
        private long count;
    }
}
