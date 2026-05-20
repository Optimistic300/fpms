package com.forig.fpms.repository;

import com.forig.fpms.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByActivityId(Long activityId);

    List<Document> findByProjectId(Long projectId);

    List<Document> findByUploadedByIdOrderByCreatedAtDesc(Long userId);

    List<Document> findByLibraryItemTrueOrderByCreatedAtDesc();

    @Query("""
        SELECT d FROM Document d
        WHERE d.libraryItem = true
          AND (:search IS NULL OR d.fileName LIKE CONCAT('%', :search, '%'))
          AND (:divisionId IS NULL OR (d.project IS NOT NULL AND d.project.division.id = :divisionId))
          AND (:projectId IS NULL OR (d.project IS NOT NULL AND d.project.id = :projectId))
          AND (:researchArea IS NULL OR (d.project IS NOT NULL AND d.project.researchArea LIKE CONCAT('%', :researchArea, '%')))
        ORDER BY d.createdAt DESC
        """)
    List<Document> findLibraryItems(
            @Param("search") String search,
            @Param("divisionId") Long divisionId,
            @Param("projectId") Long projectId,
            @Param("researchArea") String researchArea);
}
