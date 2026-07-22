package com.resumeiq.service;

import com.resumeiq.dto.response.ResumeTemplateResponse;
import com.resumeiq.entity.ResumeTemplate;
import com.resumeiq.repository.ResumeTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeTemplateService {

    private final ResumeTemplateRepository resumeTemplateRepository;

    private static final List<String> TEMPLATE_NAMES = List.of(
        "Modern", "Professional", "Minimal", "Corporate", "Creative", "Executive", "Student", "Developer"
    );

    @Transactional
    public List<ResumeTemplateResponse> getTemplates() {
        // Pre-populate templates if empty
        if (resumeTemplateRepository.count() == 0) {
            for (String name : TEMPLATE_NAMES) {
                ResumeTemplate template = ResumeTemplate.builder()
                        .templateName(name)
                        .templateCategory("Standard")
                        .primaryColor("#6366f1") // default indigo
                        .secondaryColor("#0f172a") // default slate
                        .font("Inter")
                        .isPremium(false)
                        .build();
                resumeTemplateRepository.save(template);
            }
        }

        List<ResumeTemplate> list = resumeTemplateRepository.findAll();
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ResumeTemplateResponse mapToResponse(ResumeTemplate t) {
        return ResumeTemplateResponse.builder()
                .id(t.getId())
                .templateName(t.getTemplateName())
                .templateCategory(t.getTemplateCategory())
                .primaryColor(t.getPrimaryColor())
                .secondaryColor(t.getSecondaryColor())
                .font(t.getFont())
                .previewImage(t.getPreviewImage())
                .isPremium(t.getIsPremium())
                .build();
    }
}
