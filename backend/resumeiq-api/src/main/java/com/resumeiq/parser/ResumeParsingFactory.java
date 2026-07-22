package com.resumeiq.parser;

import com.resumeiq.exception.CustomException;
import com.resumeiq.parser.docx.DocxResumeParser;
import com.resumeiq.parser.pdf.PdfResumeParser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResumeParsingFactory {

    private final PdfResumeParser pdfResumeParser;
    private final DocxResumeParser docxResumeParser;

    public ResumeParser getParser(String fileExtension) {
        if (fileExtension == null) {
            throw new CustomException("File format detection failed: missing file extension.", HttpStatus.BAD_REQUEST);
        }

        String ext = fileExtension.trim().toLowerCase();
        switch (ext) {
            case "pdf":
                return pdfResumeParser;
            case "docx":
                return docxResumeParser;
            default:
                throw new CustomException("Unsupported resume file format '" + fileExtension + "'. Only PDF and DOCX are supported for parsing.", HttpStatus.BAD_REQUEST);
        }
    }
}
