package com.resumeiq.parser;

public interface ResumeParser {
    String parseToRawText(byte[] fileBytes);
}
