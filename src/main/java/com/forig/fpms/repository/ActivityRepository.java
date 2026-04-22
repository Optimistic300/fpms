package com.forig.fpms.repository;

import com.forig.fpms.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByUserId(Long userId);

    List<Activity> findByProjectId(Long projectId);

    List<Activity> findByActivityDateBetween(LocalDate start, LocalDate end);

    List<Activity> findByProjectIdAndActivityDateBetween(Long projectId, LocalDate start, LocalDate end);
}