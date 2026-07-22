package com.resumeiq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeExportService {

    private final ObjectMapper objectMapper;

    /**
     * Converts a resume JSON string into a structured Microsoft Word (.docx) byte array.
     */
    public byte[] exportToDocx(String resumeJson) {
        if (resumeJson == null || resumeJson.trim().isEmpty()) {
            throw new CustomException("Resume data payload is empty.", HttpStatus.BAD_REQUEST);
        }

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // Parse JSON structure
            JsonNode root = objectMapper.readTree(resumeJson);

            // 1. Title / Contact header
            JsonNode personal = root.path("personalInfo");
            if (!personal.isMissingNode()) {
                String name = personal.path("fullName").asText("Candidate Name");
                XWPFParagraph namePara = document.createParagraph();
                namePara.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun nameRun = namePara.createRun();
                nameRun.setText(name);
                nameRun.setBold(true);
                nameRun.setFontSize(22);
                nameRun.setFontFamily("Calibri");

                XWPFParagraph contactPara = document.createParagraph();
                contactPara.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun contactRun = contactPara.createRun();
                String email = personal.path("email").asText("");
                String phone = personal.path("phone").asText("");
                String loc = personal.path("location").asText("");
                String web = personal.path("linkedin").asText("");

                StringBuilder sb = new StringBuilder();
                if (!email.isEmpty()) sb.append(email).append(" | ");
                if (!phone.isEmpty()) sb.append(phone).append(" | ");
                if (!loc.isEmpty()) sb.append(loc).append(" | ");
                if (!web.isEmpty()) sb.append(web);
                contactRun.setText(sb.toString());
                contactRun.setFontSize(10);
                contactRun.setFontFamily("Calibri");
            }

            // 2. Summary
            String summary = root.path("professionalSummary").asText("");
            if (summary.isEmpty()) {
                // Check if nested in personalInfo
                summary = personal.path("professionalSummary").asText("");
            }
            if (!summary.isEmpty()) {
                createSectionHeading(document, "PROFESSIONAL SUMMARY");
                XWPFParagraph sumPara = document.createParagraph();
                XWPFRun sumRun = sumPara.createRun();
                sumRun.setText(summary);
                sumRun.setFontSize(11);
                sumRun.setFontFamily("Calibri");
            }

            // 3. Education
            JsonNode edu = root.path("education");
            if (edu.isArray() && !edu.isEmpty()) {
                createSectionHeading(document, "EDUCATION");
                for (JsonNode e : edu) {
                    XWPFParagraph eduPara = document.createParagraph();
                    XWPFRun schoolRun = eduPara.createRun();
                    schoolRun.setBold(true);
                    schoolRun.setText(e.path("college").asText("University") + " — ");
                    
                    XWPFRun degreeRun = eduPara.createRun();
                    degreeRun.setText(e.path("degree").asText("Degree") + " in " + e.path("branch").asText("Field") + "  ");
                    
                    XWPFRun dateRun = eduPara.createRun();
                    dateRun.setItalic(true);
                    dateRun.setText("(" + e.path("startYear").asText("") + " - " + e.path("endYear").asText("") + ") ");

                    String grade = e.path("cgpa").asText("");
                    if (grade.isEmpty()) grade = e.path("percentage").asText("");
                    if (!grade.isEmpty()) {
                        XWPFRun gradeRun = eduPara.createRun();
                        gradeRun.setText("| Grade: " + grade);
                    }
                }
            }

            // 4. Skills
            JsonNode skills = root.path("skills");
            if (!skills.isMissingNode() && !skills.isEmpty()) {
                createSectionHeading(document, "TECHNICAL SKILLS");
                
                addSkillsLine(document, "Programming Languages: ", skills.path("programmingLanguages"));
                addSkillsLine(document, "Frameworks: ", skills.path("frameworks"));
                addSkillsLine(document, "Databases: ", skills.path("databases"));
                addSkillsLine(document, "Cloud / DevOps: ", skills.path("cloud"));
                addSkillsLine(document, "Tools: ", skills.path("tools"));
            }

            // 5. Work Experience
            JsonNode exp = root.path("experience");
            if (exp.isArray() && !exp.isEmpty()) {
                createSectionHeading(document, "WORK EXPERIENCE");
                for (JsonNode entry : exp) {
                    XWPFParagraph expPara = document.createParagraph();
                    XWPFRun roleRun = expPara.createRun();
                    roleRun.setBold(true);
                    roleRun.setText(entry.path("role").asText("Role") + " at ");
                    
                    XWPFRun compRun = expPara.createRun();
                    compRun.setText(entry.path("company").asText("Company") + "  ");
                    
                    XWPFRun durationRun = expPara.createRun();
                    durationRun.setItalic(true);
                    durationRun.setText("(" + entry.path("duration").asText("Timeline") + ")");

                    JsonNode bullets = entry.path("responsibilities");
                    if (bullets.isArray()) {
                        for (JsonNode b : bullets) {
                            XWPFParagraph bulletPara = document.createParagraph();
                            bulletPara.setIndentationLeft(360); // indentation
                            XWPFRun bRun = bulletPara.createRun();
                            bRun.setText("• " + b.asText());
                            bRun.setFontSize(10.5);
                            bRun.setFontFamily("Calibri");
                        }
                    }
                }
            }

            // 6. Projects
            JsonNode projs = root.path("projects");
            if (projs.isArray() && !projs.isEmpty()) {
                createSectionHeading(document, "PROJECTS");
                for (JsonNode p : projs) {
                    XWPFParagraph projPara = document.createParagraph();
                    XWPFRun titleRun = projPara.createRun();
                    titleRun.setBold(true);
                    titleRun.setText(p.path("projectName").asText("Project Title") + " — ");
                    
                    XWPFRun descRun = projPara.createRun();
                    descRun.setText(p.path("description").asText("") + " ");
                    
                    JsonNode tech = p.path("technologies");
                    if (tech.isArray() && !tech.isEmpty()) {
                        XWPFRun techRun = projPara.createRun();
                        techRun.setItalic(true);
                        
                        List<String> list = new ArrayList<>();
                        for (JsonNode t : tech) list.add(t.asText());
                        techRun.setText("\nTechnologies: " + String.join(", ", list));
                        techRun.setFontSize(9.5);
                    }
                }
            }

            document.write(baos);
            return baos.toByteArray();

        } catch (IOException e) {
            throw new CustomException("Failed to generate Microsoft Word document: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void createSectionHeading(XWPFDocument document, String title) {
        XWPFParagraph hr = document.createParagraph();
        hr.setBorderBottom(Borders.SINGLE);
        XWPFRun run = hr.createRun();
        run.setText(title);
        run.setBold(true);
        run.setFontSize(13);
        run.setFontFamily("Calibri");
    }

    private void addSkillsLine(XWPFDocument document, String category, JsonNode node) {
        if (node.isArray() && !node.isEmpty()) {
            XWPFParagraph para = document.createParagraph();
            XWPFRun catRun = para.createRun();
            catRun.setBold(true);
            catRun.setText(category);
            catRun.setFontSize(10.5);
            catRun.setFontFamily("Calibri");

            List<String> list = new ArrayList<>();
            for (JsonNode n : node) list.add(n.asText());
            XWPFRun listRun = para.createRun();
            listRun.setText(String.join(", ", list));
            listRun.setFontSize(10.5);
            listRun.setFontFamily("Calibri");
        }
    }
}
