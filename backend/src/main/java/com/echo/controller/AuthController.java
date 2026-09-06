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
                .map(u -> new UserResponse(u.id(), u.email(), u.name(), u.picture()))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
