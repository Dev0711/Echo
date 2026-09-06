package com.echo.security;

import com.echo.model.User;
import com.echo.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class OAuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final String frontendUrl;

    public OAuthSuccessHandler(
            UserRepository userRepository,
            JwtService jwtService,
            @Value("${echo.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String googleId = oauthUser.getAttribute("sub");
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");

        // Find or create user
        User user = userRepository.findByGoogleId(googleId)
                .orElse(null);

        if (user == null) {
            user = new User(null, googleId, email, name, picture,
                    LocalDateTime.now(), LocalDateTime.now());
        } else {
            user = new User(user.id(), user.googleId(), user.email(),
                    name, picture, user.createdAt(), LocalDateTime.now());
        }
        user = userRepository.save(user);

        // Generate JWT and redirect to frontend
        String token = jwtService.generateToken(user.id(), email, name);
        getRedirectStrategy().sendRedirect(request, response,
                frontendUrl + "/auth/callback?token=" + token);
    }
}
