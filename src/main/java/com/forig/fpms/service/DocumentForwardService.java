package com.forig.fpms.service;

import com.forig.fpms.dto.ForwardRequest;
import com.forig.fpms.dto.ForwardResponse;
import com.forig.fpms.model.DocumentForward;
import com.forig.fpms.model.User;
import com.forig.fpms.repository.DocumentForwardRepository;
import com.forig.fpms.repository.DocumentRepository;
import com.forig.fpms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentForwardService {

    private final DocumentForwardRepository forwardRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentService documentService;

    public ForwardResponse forward(Long documentId, ForwardRequest request, User sender) {
        var doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        var recipient = userRepository.findById(request.getForwardedToUserId())
                .orElseThrow(() -> new RuntimeException("Recipient user not found"));

        DocumentForward forward = DocumentForward.builder()
                .document(doc)
                .forwardedBy(sender)
                .forwardedTo(recipient)
                .message(request.getMessage())
                .read(false)
                .build();

        return toResponse(forwardRepository.save(forward));
    }

    public List<ForwardResponse> getInbox(Long userId) {
        return forwardRepository.findByForwardedToIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    public long getUnreadCount(Long userId) {
        return forwardRepository.countByForwardedToIdAndReadFalse(userId);
    }

    public ForwardResponse markRead(Long forwardId, User user) {
        DocumentForward forward = forwardRepository.findById(forwardId)
                .orElseThrow(() -> new RuntimeException("Forward not found"));
        if (!forward.getForwardedTo().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized");
        }
        forward.setRead(true);
        return toResponse(forwardRepository.save(forward));
    }

    private ForwardResponse toResponse(DocumentForward f) {
        return ForwardResponse.builder()
                .id(f.getId())
                .document(documentService.toResponse(f.getDocument()))
                .forwardedByName(f.getForwardedBy().getFullName())
                .forwardedToName(f.getForwardedTo().getFullName())
                .message(f.getMessage())
                .read(f.isRead())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
