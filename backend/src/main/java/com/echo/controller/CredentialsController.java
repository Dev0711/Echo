package com.echo.controller;

import com.echo.dto.CredentialStatusResponse;
import com.echo.dto.SaveCredentialRequest;
import com.echo.model.PlatformCredential;
import com.echo.repository.PlatformCredentialRepository;
import com.echo.security.EncryptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/credentials")
@Tag(name = "Credentials", description = "Platform credential management")
public class CredentialsController {

    private final PlatformCredentialRepository credentialRepository;
    private final EncryptionService encryptionService;

    public CredentialsController(PlatformCredentialRepository credentialRepository,
                                  EncryptionService encryptionService) {
        this.credentialRepository = credentialRepository;
        this.encryptionService = encryptionService;
    }

    @GetMapping
    @Operation(summary = "Get all connected platforms")
    public List<CredentialStatusResponse> getAll(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return credentialRepository.findAllByUserId(userId).stream()
                .map(c -> new CredentialStatusResponse(c.platform(), c.connected(), c.connectedAt()))
                .collect(Collectors.toList());
    }

    @PostMapping("/{platform}")
    @Operation(summary = "Save credentials for a platform")
    public CredentialStatusResponse save(
            @PathVariable String platform,
            @RequestBody SaveCredentialRequest request,
            Authentication auth) {
        String userId = (String) auth.getPrincipal();

        // Remove existing if present
        credentialRepository.findByUserIdAndPlatform(userId, platform)
                .ifPresent(c -> credentialRepository.deleteById(c.id()));

        PlatformCredential credential = new PlatformCredential(
                null, userId, platform,
                encryptionService.encrypt(request.apiKey()),
                encryptionService.encrypt(request.accessToken()),
                encryptionService.encrypt(request.refreshToken()),
                encryptionService.encrypt(request.clientId()),
                encryptionService.encrypt(request.clientSecret()),
                true,
                LocalDateTime.now()
        );
        credentialRepository.save(credential);
        return new CredentialStatusResponse(platform, true, credential.connectedAt());
    }

    @DeleteMapping("/{platform}")
    @Operation(summary = "Disconnect a platform")
    public void delete(@PathVariable String platform, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        credentialRepository.deleteByUserIdAndPlatform(userId, platform);
    }
}
