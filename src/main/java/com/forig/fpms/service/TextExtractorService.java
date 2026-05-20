package com.forig.fpms.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TextExtractorService {

    public String extract(MultipartFile file, String contentType) {
        if (contentType == null) return null;
        try {
            if (contentType.equals("application/pdf")) {
                return extractPdf(file);
            }
            if (contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    || contentType.equals("application/msword")) {
                return extractDocx(file);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String extractPdf(MultipartFile file) throws Exception {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private String extractDocx(MultipartFile file) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }
}
