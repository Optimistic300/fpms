package com.forig.fpms.repository;

import com.forig.fpms.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(String status);

    List<Project> findByLeadId(Long leadId);
}