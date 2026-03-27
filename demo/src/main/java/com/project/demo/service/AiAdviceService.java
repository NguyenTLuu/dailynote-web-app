package com.project.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiAdviceService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=";
    public String generateAdvice(int rate, String noteText, List<String> tagNames) {

        String prompt = String.format(
                "Bạn là một chuyên gia tâm lý thấu hiểu và thân thiện. " +
                        "Hôm nay người dùng chấm điểm ngày của họ là %d/5. " +
                        "Họ đã chọn các tag: %s. " +
                        "Ghi chú thêm của họ: '%s'. " +
                        "Hãy đọc những thông tin trên và đưa ra một lời nhận xét hoặc khuyên nhủ ngắn gọn (dưới 40 chữ), tích cực và ấm áp nhé!",
                rate, String.join(", ", tagNames), noteText
        );

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            String url = GEMINI_API_URL + apiKey;
            String responseStr = restTemplate.postForObject(url, request, String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(responseStr);

            return rootNode.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText().trim();

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.err.println("=== LỖI TỪ GEMINI API ===");
            System.err.println("Status: " + e.getStatusCode());
            System.err.println("Chi tiết: " + e.getResponseBodyAsString());
            return "Hệ thống AI đang bận đi trà sữa, nhưng nhìn chung hôm nay bạn đã làm rất tốt! ❤️";
        } catch (Exception e) {
            // Lỗi đứt mạng, Parse JSON lỗi, v.v.
            System.err.println("=== LỖI HỆ THỐNG / KẾT NỐI ===");
            e.printStackTrace();
            return "Hệ thống AI đang bận đi trà sữa, nhưng nhìn chung hôm nay bạn đã làm rất tốt! ❤️";
        }
    }
}