package com.resumeiq.parser.docx;

import com.resumeiq.exception.CustomException;
import com.resumeiq.parser.ResumeParser;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@Component
public class DocxResumeParser implements ResumeParser {

    @Override
    public String parseToRawText(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new CustomException("The uploaded DOCX file is empty.", HttpStatus.BAD_REQUEST);
        }

        try (ByteArrayInputStream bais = new ByteArrayInputStream(fileBytes);
             XWPFDocument document = new XWPFDocument(bais);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {

            String text = extractor.getText();
            if (text == null || text.trim().isEmpty()) {
                throw new CustomException("The DOCX document does not contain any readable text.", HttpStatus.BAD_REQUEST);
            }

            return text;
        } catch (IOException | RuntimeException e) {
            throw new CustomException("The DOCX file is corrupted, invalid, or cannot be parsed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
