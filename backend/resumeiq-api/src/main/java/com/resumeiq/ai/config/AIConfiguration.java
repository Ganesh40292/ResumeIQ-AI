package com.resumeiq.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@Getter
@Setter
public class AIConfiguration {

    @Value("${gemini.api-key:mock-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${gemini.endpoint-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String endpointUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
