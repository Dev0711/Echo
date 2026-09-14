package com.echo.controller;

import com.echo.dto.UserResponse;
import com.echo.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return userRepository.findById(userId)
                .map(u -> new UserResponse(u.id(), u.email(), u.name(), u.picture(), u.bio(), u.avatarUrl()))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PatchMapping("/profile")
    public UserResponse updateProfile(Authentication auth, @RequestBody com.echo.dto.UpdateProfileRequest request) {
        String userId = (String) auth.getPrincipal();
        com.echo.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        com.echo.model.User updatedUser = new com.echo.model.User(
                user.id(),
                user.googleId(),
                user.email(),
                request.name() != null ? request.name() : user.name(),
                user.picture(),
                user.createdAt(),
                user.lastLoginAt(),
                request.bio() != null ? request.bio() : user.bio(),
                request.avatarUrl() != null ? request.avatarUrl() : user.avatarUrl()
        );
        userRepository.save(updatedUser);
        
        return new UserResponse(updatedUser.id(), updatedUser.email(), updatedUser.name(), updatedUser.picture(), updatedUser.bio(), updatedUser.avatarUrl());
    }
}
