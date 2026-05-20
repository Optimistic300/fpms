package com.forig.fpms.service;

import com.forig.fpms.dto.DivisionResponse;
import com.forig.fpms.repository.DivisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DivisionService {

    private final DivisionRepository divisionRepository;

    public List<DivisionResponse> getAll() {
        return divisionRepository.findAllByOrderByNameAsc()
                .stream()
                .map(d -> DivisionResponse.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .description(d.getDescription())
                        .build())
                .toList();
    }
}
