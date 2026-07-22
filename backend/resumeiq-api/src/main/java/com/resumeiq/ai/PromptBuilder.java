package com.resumeiq.ai;

import org.springframework.util.StringUtils;

public class PromptBuilder {

    public static String buildResumeReviewPrompt(String parsedJson, String atsReportJson, String preferences) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert ATS (Applicant Tracking System) reviewer and hiring consultant. Analyze the candidate's resume and ATS report to provide structured improvements. Do NOT repeat the numeric ATS scores, instead focus on actionable explanations, rewriting headlines, weakness checks, grammar, and writing improvements.\n\n");
        sb.append("Candidate parsed resume data:\n").append(parsedJson).append("\n\n");
        sb.append("ATS scoring evaluations:\n").append(atsReportJson).append("\n\n");
        
        if (StringUtils.hasText(preferences)) {
            sb.append("User requested focus / preferences:\n").append(preferences).append("\n\n");
        }

        sb.append("Provide a comprehensive assessment using professional Markdown formatting. Include the following sections explicitly:\n");
        sb.append("1. **Overall AI Review**: High-level summary of the resume's target profile alignment.\n");
        sb.append("2. **Resume Strengths**: Bullet points of what is done exceptionally well.\n");
        sb.append("3. **Areas to Improve**: Detailed gaps in content, grammar, or contact details.\n");
        sb.append("4. **Headline & Brand**: Suggested resume headlines or branding taglines (e.g. 'Senior Full-Stack Engineer | Specialized in Spring Boot & React').\n");
        sb.append("5. **Grammar & Writing Quality**: Critique of writing style, passive voice vs active action verbs, and structural flow.\n");
        sb.append("6. **ATS Optimization Tips**: What is missing for ATS compliance (headings, layout formats, sections ordering).\n");
        sb.append("7. **Overall Action Plan**: Prioritized checklist (e.g. Step 1, Step 2) for the candidate.\n");

        return sb.toString();
    }

    public static String buildProjectReviewPrompt(String projectsJson, String preferences) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert technical interviewer. Evaluate the projects listed in the candidate's resume and generate suggestions to highlight engineering depth, business impact, and modern metrics.\n\n");
        sb.append("Projects details:\n").append(projectsJson).append("\n\n");

        if (StringUtils.hasText(preferences)) {
            sb.append("User requested focus / preferences:\n").append(preferences).append("\n\n");
        }

        sb.append("For every project listed in the JSON, provide a detailed review in Markdown. Include:\n");
        sb.append("- **Project Strengths**: What makes the implementation sound.\n");
        sb.append("- **Project Gaps & Weaknesses**: What details are missing (e.g. scaling, performance benchmarks, security).\n");
        sb.append("- **Business Impact**: How this project translates to business value (e.g. cost reduction, user engagement).\n");
        sb.append("- **Suggested Technologies & Metrics**: Modern tools to add or metrics to quantify (e.g. 'Improved database query response by 30%').\n");
        sb.append("- **Professional Rewrite**: A high-impact bulleted rewrite of the project description using active verbs and metrics.\n");

        return sb.toString();
    }

    public static String buildSummaryPrompt(String personalInfo, String experience, String skills, String preferences) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a professional resume writer. Generate highly optimized summary statements tailored to the candidate's career experience and skills profile.\n\n");
        sb.append("Personal details:\n").append(personalInfo).append("\n");
        sb.append("Skills details:\n").append(skills).append("\n");
        sb.append("Work history details:\n").append(experience).append("\n\n");

        if (StringUtils.hasText(preferences)) {
            sb.append("Target role or user preferences:\n").append(preferences).append("\n\n");
        }

        sb.append("Generate the following three items in professional Markdown:\n");
        sb.append("1. **Professional Summary**: A 3-4 sentence high-impact summary suitable for the top of the resume, focusing on key achievements and technical specialties.\n");
        sb.append("2. **Career Objective**: A shorter version tailored for career changers or entry-level positions, explaining aspirations and value-add.\n");
        sb.append("3. **LinkedIn 'About' Section**: A conversational, engaging summary written in the first person ('I am...'), blending technical skills, values, and collaboration approach, optimized for recruiting algorithms.\n");

        return sb.toString();
    }

    public static String buildSkillsPrompt(String skills, String experience, String preferences) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a career development coach and technical architect. Analyze the candidate's skills and experience to recommend career roadmap steps, learning paths, and missing skill badges.\n\n");
        sb.append("Current skills inventory:\n").append(skills).append("\n");
        sb.append("Current experience:\n").append(experience).append("\n\n");

        if (StringUtils.hasText(preferences)) {
            sb.append("Career goals or user preferences:\n").append(preferences).append("\n\n");
        }

        sb.append("Generate a detailed career analysis in Markdown containing:\n");
        sb.append("1. **Technical Skill Suggestions**: Grouped recommendations for Programming languages, Frameworks, Cloud, databases, and DevOps tools to learn next to bridge gaps.\n");
        sb.append("2. **Soft Skill Suggestions**: Key interpersonal/career skills to practice (e.g. Stakeholder Management, Architecture design).\n");
        sb.append("3. **Career Roadmap & Suitable Roles**: 2-3 target job roles (e.g. Solutions Architect, Lead Engineer) and the skill path needed to achieve them.\n");
        sb.append("4. **Learning Roadmap**: Suggested courses, certifications (e.g., AWS Certified Solutions Architect, Certified ScrumMaster), and open-source contributions to build credentials.\n");
        sb.append("5. **Portfolio & Open Source Improvements**: Concrete ideas for github projects or repository contributions to demonstrate these skills.\n");

        return sb.toString();
    }
}
