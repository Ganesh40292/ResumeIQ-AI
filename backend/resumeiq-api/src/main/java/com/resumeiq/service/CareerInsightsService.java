package com.resumeiq.service;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class CareerInsightsService {

    public List<String> generateInsights(int currentAts, int avgAts, int totalInterviews, int avgInterview, int totalMatches, int completion) {
        List<String> list = new ArrayList<>();

        if (totalInterviews > 0) {
            list.add("You have successfully completed " + totalInterviews + " mock interview preparation session(s).");
            if (avgInterview >= 80) {
                list.add("Excellent! Your average mock interview rating is outstanding (" + avgInterview + "%). You are placement ready.");
            } else {
                list.add("Your average mock interview rating is " + avgInterview + "%. Try reviewing expectation hints and retry mixed technical prep.");
            }
        } else {
            list.add("No mock interviews completed yet. Practicing recruiter-style preps will improve your career readiness.");
        }

        if (currentAts > 0) {
            list.add("Your active resume ATS score is " + currentAts + "%.");
            if (currentAts >= 80) {
                list.add("Great! Your resume formatting and technical keywords density align with high-scoring ATS targets.");
            } else {
                list.add("Adding cloud tools or quantitative metric bullet points can help lift your ATS rating above 80%.");
            }
        }

        if (totalMatches > 0) {
            list.add("You cross-referenced your profile with " + totalMatches + " job posting description(s) this month.");
        }

        if (completion < 80) {
            list.add("Your parsed resume profile completion is currently at " + completion + "%. Consider adding certifications or languages to build a complete profile.");
        } else {
            list.add("Your profile details are complete (" + completion + "%). Continue optimizing project descriptions keywords.");
        }

        return list;
    }

    public List<String> getStrengths(int ats, int interview) {
        List<String> list = new ArrayList<>();
        list.add("Core technical skills section alignment.");
        if (ats >= 80) {
            list.add("Quantitative project achievements descriptions.");
        }
        if (interview >= 85) {
            list.add("Structured STAR-method communication responses.");
        } else {
            list.add("Clear answers length and completeness.");
        }
        return list;
    }

    public List<String> getWeaknesses(int ats, int interview) {
        List<String> list = new ArrayList<>();
        if (ats < 80) {
            list.add("Missing required core technology keywords.");
        }
        if (interview < 80) {
            list.add("System design and latency tuning definitions.");
        }
        list.add("Cloud deployment or DevOps pipelines visibility.");
        return list;
    }

    public List<String> getStudyRecommendations(int ats, int interview) {
        List<String> list = new ArrayList<>();
        list.add("Master container platforms like Docker and cloud registries like AWS.");
        list.add("Practice mixed technical mock interviews covering SQL indexes and cache strategies.");
        list.add("Tune resume project bulletins to reflect business outcomes (e.g. 'reduced latency by 20%').");
        return list;
    }
}
