package com.forig.fpms.repository;

import com.forig.fpms.model.DocumentForward;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentForwardRepository extends JpaRepository<DocumentForward, Long> {

    List<DocumentForward> findByForwardedToIdOrderByCreatedAtDesc(Long userId);

    long countByForwardedToIdAndReadFalse(Long userId);

    void deleteByDocumentId(Long documentId);
}
