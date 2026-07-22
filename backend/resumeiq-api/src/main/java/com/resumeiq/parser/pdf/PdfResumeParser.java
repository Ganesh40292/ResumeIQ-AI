package com.resumeiq.parser.pdf;

import com.resumeiq.exception.CustomException;
import com.resumeiq.parser.ResumeParser;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class PdfResumeParser implements ResumeParser {

    @Override
    public String parseToRawText(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new CustomException("The uploaded PDF file is empty.", HttpStatus.BAD_REQUEST);
        }

        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            // Check for encryption
            if (document.isEncrypted()) {
                throw new CustomException("The PDF file is encrypted/password protected and cannot be parsed.", HttpStatus.BAD_REQUEST);
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            if (text == null || text.trim().isEmpty()) {
                throw new CustomException("The PDF document does not contain any readable text.", HttpStatus.BAD_REQUEST);
            }

            return text;
        } catch (IOException e) {
            throw new CustomException("The PDF file is corrupted or cannot be read: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
