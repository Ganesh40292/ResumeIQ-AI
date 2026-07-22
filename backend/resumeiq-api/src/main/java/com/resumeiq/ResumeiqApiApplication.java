package com.resumeiq;

import com.resumeiq.entity.*;
import com.resumeiq.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@SpringBootApplication
public class ResumeiqApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResumeiqApiApplication.class, args);
	}

	@Bean
	public CommandLineRunner demoSeeder(
			UserRepository userRepository,
			ResumeRepository resumeRepository,
			ResumeVersionRepository resumeVersionRepository,
			ATSReportRepository atsReportRepository) {
		return args -> {
			Optional<User> userOpt = userRepository.findByEmail("ganeshprasadnayak292@gmail.com");
			if (userOpt.isPresent()) {
				User user = userOpt.get();
				long count = resumeRepository.findByUserIdAndIsDeletedFalse(user.getId(), org.springframework.data.domain.Sort.by("uploadDate")).size();
				if (count == 0) {
					// Seed a mock resume for this user
					Resume resume = Resume.builder()
							.userId(user.getId())
							.originalFileName("Brian_Wayne_Resume.pdf")
							.storedFileName(UUID.randomUUID().toString() + ".pdf")
							.fileType("application/pdf")
							.fileSize(102400L)
							.fileExtension("pdf")
							.uploadDate(LocalDateTime.now())
							.lastModified(LocalDateTime.now())
							.resumeTitle("Brian Wayne - Business Dev")
							.resumeVersion(1)
							.storagePath("/uploads/brian_wayne_resume.pdf")
							.isDefaultResume(true)
							.isDeleted(false)
							.build();
					resume = resumeRepository.save(resume);

					// Seed Resume Version Json
					String sampleJson = "{\"personalInfo\":{\"fullName\":\"Brian T. Wayne\",\"email\":\"brian.wayne@example.com\",\"phone\":\"(555) 123-4567\",\"location\":\"New York, NY\",\"linkedin\":\"linkedin.com/in/brianwayne\",\"professionalSummary\":\"Results-driven Business Development Consultant with 5+ years of experience steering client acquisitions, sales growth strategies, and enterprise-level client partnerships. Proven history of optimizing sales funnels and hitting revenue quotas.\"},\"education\":[{\"college\":\"New York University\",\"degree\":\"Bachelor of Science\",\"branch\":\"Business Administration\",\"startYear\":\"2015\",\"endYear\":\"2019\"}],\"skills\":{\"programmingLanguages\":[\"Python\",\"SQL\"],\"frameworks\":[\"Pandas\"],\"databases\":[\"PostgreSQL\"],\"cloud\":[\"AWS\"],\"tools\":[\"Salesforce\",\"Excel\",\"Tableau\"]},\"experience\":[{\"role\":\"Business Development Lead\",\"company\":\"GrowthForce Consultancy\",\"duration\":\"2021 - Present\",\"responsibilities\":[\"Led business development campaigns yielding 30% expansion in active pipeline size.\",\"Negotiated corporate contracts valued at $500K+ average contract value (ACV).\",\"Managed sales pipelines using Salesforce CRM and automated analytics pipelines.\"]},{\"role\":\"Sales Development Representative\",\"company\":\"TechStart Inc.\",\"duration\":\"2019 - 2021\",\"responsibilities\":[\"Conducted cold outreach campaigns hitting 120% of monthly quota target metrics.\",\"Collaborated with marketing leads to qualify inbound lead pipelines.\"]}],\"projects\":[{\"projectName\":\"Sales Pipeline Optimization\",\"duration\":\"2023\",\"description\":\"Redesigned growth CRM workflows, reducing sales cycle duration by 15 days.\",\"githubLink\":\"github.com/brianwayne/crm-opt\"}],\"achievements\":[\"Awarded Consultant of the Year at GrowthForce (2023)\",\"Hired and mentored 5 junior sales consultants scaling department size.\"],\"languages\":[\"English\",\"Spanish\"]}";
					ResumeVersion version = ResumeVersion.builder()
							.resumeId(resume.getId())
							.versionName("V1 Original")
							.versionNumber(1)
							.resumeJson(sampleJson)
							.createdBy("system-seeder")
							.build();
					resumeVersionRepository.save(version);

					// Seed ATS Report
					ATSReport report = ATSReport.builder()
							.resumeId(resume.getId())
							.overallScore(85)
							.formattingScore(90)
							.educationScore(80)
							.experienceScore(85)
							.projectsScore(90)
							.skillsScore(80)
							.keywordScore(85)
							.achievementsScore(90)
							.readabilityScore(85)
							.structureScore(90)
							.keywordResults("{\"detectedKeywords\":[\"sales\",\"business development\",\"Salesforce\",\"Excel\",\"Python\",\"SQL\",\"pipeline\",\"lead qualification\"],\"missingKeywords\":[\"KPIs\",\"budgeting\",\"strategic planning\"],\"suggestedKeywords\":[\"SaaS sales\",\"customer acquisition\",\"contract negotiation\"]}")
							.suggestions("[{\"message\":\"Add more metrics detailing revenue impact for TechStart.\",\"section\":\"Experience\",\"priority\":\"HIGH\",\"completed\":false},{\"message\":\"Include cloud DevOps tools to highlight analytical skills.\",\"section\":\"Skills\",\"priority\":\"MEDIUM\",\"completed\":false}]")
							.build();
					atsReportRepository.save(report);
				}
			}
		};
	}

}
