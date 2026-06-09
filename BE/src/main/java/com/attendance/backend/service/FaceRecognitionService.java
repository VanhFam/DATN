package com.attendance.backend.service;

import com.attendance.backend.entity.Student;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.utils.TimeUtils;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
public class FaceRecognitionService {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;
    private final StudentRepository studentRepository;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(FaceRecognitionService.class);

    public FaceRecognitionService(RestTemplate restTemplate, StudentRepository studentRepository) {
        this.restTemplate = restTemplate;
        this.studentRepository = studentRepository;
    }

    @Transactional
    public void registerFace(String studentId, String base64Image) {
        logger.info("[DEBUG] Đang đăng ký khuôn mặt cho SV: {}", studentId);

        String url = aiServiceUrl + "/face/register";
        Map<String, String> body = new HashMap<>();
        body.put("image", base64Image);

        try {
            logger.info("[DEBUG] Gọi API URL: {}", url);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, body, Map.class);

            if (response.getBody() == null || !response.getBody().containsKey("embedding")) {
                throw new RuntimeException("AI response không chứa embedding");
            }

            Object rawEmbedding = response.getBody().get("embedding");
            if (!(rawEmbedding instanceof List)) {
                throw new RuntimeException("Embedding từ AI không đúng định dạng (phải là mảng)");
            }
            List<?> embeddingList = (List<?>) rawEmbedding;
            if (embeddingList.isEmpty()) {
                throw new RuntimeException("Embedding từ AI trả về rỗng");
            }

            String embeddingStr = embeddingList.toString();

            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên: " + studentId));

            student.setFaceEmbedding(embeddingStr);
            studentRepository.save(student);
            logger.info("[DEBUG] Đăng ký THÀNH CÔNG cho SV: {}. Số chiều embedding: {}", studentId, embeddingList.size());
        } catch (Exception e) {
            logger.error("[DEBUG] Lỗi đăng ký: {}", e.getMessage());
            throw new RuntimeException("Lỗi kết nối AI Service: " + e.getMessage());
        }
    }

    public Map<String, Object> verifyFace(String base64Image, String storedEmbedding) {
        String url = aiServiceUrl + "/face/verify";
        logger.info("[DEBUG] Gọi API Xác thực URL: {}", url);

        Map<String, Object> body = new HashMap<>();
        body.put("image", base64Image);
        body.put("embedding", parseEmbedding(storedEmbedding));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, body, Map.class);
            if (response.getBody() == null) {
                throw new RuntimeException("AI service trả về response rỗng");
            }
            return response.getBody();
        } catch (Exception e) {
            logger.error("[DEBUG] Lỗi xác thực: {}", e.getMessage());
            throw new RuntimeException("Lỗi xác thực khuôn mặt: " + e.getMessage());
        }
    }

    public String findMatchingStudent(String base64Image, List<Student> galleryStudents) {
        if (galleryStudents == null || galleryStudents.isEmpty()) return null;

        String url = aiServiceUrl + "/face/search";
        Map<String, Object> body = new HashMap<>();
        body.put("image", base64Image);

        List<Map<String, Object>> gallery = new ArrayList<>();
        for (Student s : galleryStudents) {
            if (s.getFaceEmbedding() != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", s.getId());
                item.put("embedding", parseEmbedding(s.getFaceEmbedding()));
                gallery.add(item);
            }
        }
        body.put("gallery", gallery);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, body, Map.class);
            if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().get("found"))) {
                String matchedId = (String) response.getBody().get("id");
                // Xác nhận ID trả về thực sự tồn tại trong gallery
                boolean validId = galleryStudents.stream().anyMatch(s -> s.getId().equals(matchedId));
                if (!validId) {
                    logger.warn("AI trả về studentId '{}' không có trong gallery", matchedId);
                    return null;
                }
                return matchedId;
            }
        } catch (Exception e) {
            logger.error("Lỗi khi tìm khuôn mặt khớp: {}", e.getMessage());
        }
        return null;
    }

    private List<Double> parseEmbedding(String storedEmbedding) {
        if (storedEmbedding == null || storedEmbedding.isBlank()) {
            throw new RuntimeException("Embedding rỗng hoặc null");
        }
        String clean = storedEmbedding.replace("[", "").replace("]", "").trim();
        List<Double> result = new ArrayList<>();
        for (String p : clean.split(",")) {
            try {
                result.add(Double.parseDouble(p.trim()));
            } catch (NumberFormatException e) {
                throw new RuntimeException("Embedding có giá trị không hợp lệ: '" + p.trim() + "'");
            }
        }
        if (result.isEmpty()) {
            throw new RuntimeException("Embedding không có dữ liệu sau khi parse");
        }
        return result;
    }
}
