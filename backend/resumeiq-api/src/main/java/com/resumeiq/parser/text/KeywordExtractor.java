package com.resumeiq.parser.text;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class KeywordExtractor {

    private static final Map<String, List<String>> SKILL_TAXONOMY = new LinkedHashMap<>();

    static {
        // Programming Languages
        SKILL_TAXONOMY.put("languages", List.of(
            "Java", "Python", "C\\+\\+", "C#", "C", "Go", "Golang", "Rust", "Swift", "Kotlin", 
            "JavaScript", "TypeScript", "Ruby", "PHP", "Scala", "Perl", "R", "Dart", "HTML", "CSS"
        ));

        // Frameworks
        SKILL_TAXONOMY.put("frameworks", List.of(
            "Spring Boot", "Spring", "Django", "React", "Angular", "Vue\\.js", "Vue", "Next\\.js", "Nuxt\\.js",
            "Express", "Flask", "Laravel", "Rails", "Ruby on Rails", "FastAPI", "ASP\\.NET", "Flask"
        ));

        // Libraries
        SKILL_TAXONOMY.put("libraries", List.of(
            "Redux", "jQuery", "NumPy", "Pandas", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn",
            "Scipy", "OpenCV", "Axios", "Bootstrap", "Tailwind", "Material-UI", "RxJS", "Hibernate"
        ));

        // Databases
        SKILL_TAXONOMY.put("databases", List.of(
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Oracle", "SQLite", "DynamoDB", 
            "Cassandra", "Elasticsearch", "Neo4j", "MariaDB", "SQL Server"
        ));

        // Cloud Platforms
        SKILL_TAXONOMY.put("cloud", List.of(
            "AWS", "Amazon Web Services", "GCP", "Google Cloud", "Google Cloud Platform", 
            "Azure", "Microsoft Azure", "Heroku", "DigitalOcean", "Firebase"
        ));

        // DevOps & Infrastructure
        SKILL_TAXONOMY.put("devops", List.of(
            "Docker", "Kubernetes", "Jenkins", "Ansible", "Terraform", "CI/CD", "GitHub Actions",
            "GitLab CI", "CircleCI", "Prometheus", "Grafana", "ELK Stack", "Maven", "Gradle"
        ));

        // Tools / Dev Environments
        SKILL_TAXONOMY.put("tools", List.of(
            "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Postman", "VS Code", "IntelliJ",
            "Webpack", "Vite", "Figma", "Docker Compose", "Confluence"
        ));

        // Soft Skills
        SKILL_TAXONOMY.put("softSkills", List.of(
            "Leadership", "Communication", "Teamwork", "Collaboration", "Problem Solving", 
            "Time Management", "Adaptability", "Creativity", "Mentoring", "Agile", "Scrum",
            "Critical Thinking", "Conflict Resolution", "Interpersonal Skills"
        ));
    }

    /**
     * Extracts skills from text based on categories in the taxonomy.
     */
    public static Map<String, List<String>> extractSkills(String text) {
        Map<String, List<String>> extracted = new HashMap<>();
        if (text == null || text.isEmpty()) {
            for (String category : SKILL_TAXONOMY.keySet()) {
                extracted.put(category, new ArrayList<>());
            }
            return extracted;
        }

        // Standardize text for case-insensitive match
        String lowercaseText = text.toLowerCase();

        for (Map.Entry<String, List<String>> entry : SKILL_TAXONOMY.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();
            Set<String> matched = new LinkedHashSet<>();

            for (String keyword : keywords) {
                // If keywords contain regex characters like C++, protect them, or match directly.
                // We define word boundaries \b for text keyword matching.
                // Note: C++ has special characters. If keyword regex has C\\+\\+, it matches C++.
                String regex = "\\b" + keyword.toLowerCase() + "\\b";
                // Handle C++ or C# which don't end in standard word characters (word boundary \b might fail after special chars)
                if (keyword.contains("+") || keyword.contains("#")) {
                    regex = "(?:^|\\s|[.,/])" + Pattern.quote(keyword.toLowerCase()) + "(?:$|\\s|[.,/])";
                }

                Pattern pattern = Pattern.compile(regex);
                Matcher matcher = pattern.matcher(lowercaseText);
                if (matcher.find()) {
                    // Save the display keyword (original capitalization)
                    matched.add(keyword.replace("\\", "")); // Remove escape characters for presentation
                }
            }
            extracted.put(category, new ArrayList<>(matched));
        }

        return extracted;
    }
}
