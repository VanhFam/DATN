package com.attendance.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Service
public class FaceRecognitionService {

    @Value("${ai.service.url:http://attendance-ai:8001}")
    private String aiServiceUrl;

    @Value("${ai.service.key:datn_ai_secret_123}")
    private String aiServiceKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Gửi ảnh để lấy vector 128 chiều (Face Embedding)
     */
    public String getFaceEmbedding(MultipartFile image) throws IOException {
        String url = aiServiceUrl + "/extract-embedding";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("x-api-key", aiServiceKey); // Khớp với Header trong FastAPI

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(image.getBytes()) {
            @Override
            public String getFilename() {
                return image.getOriginalFilename();
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object embedding = response.getBody().get("embedding");
                // Lưu dưới dạng JSON string để AI dễ đọc lại sau này
                return embedding.toString();
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi trích xuất khuôn mặt từ AI Service: " + e.getMessage());
        }
        return null;
    }

    /**
     * So sánh ảnh mới với vector đã lưu trong Database
     */
    public Map<String, Object> verifyFace(MultipartFile image, String storedEmbedding) throws IOException {
        // Truyền embedding_data qua Query Parameter để khớp với API Python
        String url = UriComponentsBuilder.fromHttpUrl(aiServiceUrl + "/verify")
                .queryParam("embedding_data", storedEmbedding)
                .queryParam("threshold", 0.6)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("x-api-key", aiServiceKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(image.getBytes()) {
            @Override
            public String getFilename() {
                return image.getOriginalFilename();
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            return (Map<String, Object>) response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xác thực khuôn mặt qua AI Service: " + e.getMessage());
        }
    }
}
