package com.forig.fpms.repository;

import com.forig.fpms.model.Division;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DivisionRepository extends JpaRepository<Division, Long> {

    List<Division> findAllByOrderByNameAsc();
}
