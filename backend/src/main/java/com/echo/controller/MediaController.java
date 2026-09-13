package com.echo.controller;

import com.echo.dto.MediaSignatureResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    @Value("${echo.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${echo.cloudinary.api-key:}")
    private String apiKey;

    @Value("${echo.cloudinary.api-secret:}")
    private String apiSecret;

    @GetMapping("/signature")
    public ResponseEntity<MediaSignatureResponse> getSignature() {
        if (apiSecret == null || apiSecret.isBlank() || apiSecret.equals("YOUR_API_SECRET_HERE")) {
            return ResponseEntity.badRequest().build();
        }

        long timestamp = Instant.now().getEpochSecond();
        // Cloudinary requires parameters to be sorted alphabetically before signing
        // We only have timestamp, so it's simple
        String stringToSign = "timestamp=" + timestamp + apiSecret;
        String signature = sha1(stringToSign);

        return ResponseEntity.ok(new MediaSignatureResponse(signature, timestamp, apiKey, cloudName));
    }

    private String sha1(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 algorithm not found", e);
        }
    }
}
