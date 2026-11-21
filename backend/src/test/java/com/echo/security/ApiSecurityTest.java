package com.echo.security;

import com.echo.controller.PostController;
import com.echo.service.AiService;
import com.echo.service.PostService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PostController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class})
@TestPropertySource(properties = {
        "echo.jwt.secret=test-secret-test-secret-test-secret-test-secret",
        "echo.jwt.expiry-ms=60000",
        "echo.frontend-url=http://localhost:3000",
        "spring.security.oauth2.client.registration.google.client-id=x",
        "spring.security.oauth2.client.registration.google.client-secret=y",
        "spring.security.oauth2.client.registration.google.scope=email"
})
class ApiSecurityTest {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockitoBean PostService postService;
    @MockitoBean AiService aiService;
    @MockitoBean OAuthSuccessHandler oAuthSuccessHandler;

    @Test
    void apiWithoutTokenIsRejectedWith401NotARedirect() throws Exception {
        mvc.perform(get("/api/posts")).andExpect(status().isUnauthorized());
    }

    @Test
    void apiWithGarbageTokenIsRejected() throws Exception {
        mvc.perform(get("/api/posts").header("Authorization", "Bearer not-a-jwt")).andExpect(status().isUnauthorized());
    }

    @Test
    void validTokenReachesControllerWithTheTokensUserId() throws Exception {
        when(postService.getAllPosts(any())).thenReturn(List.of());
        String token = jwt.generateToken("user-42", "a@b.c", "A");
        mvc.perform(get("/api/posts").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        verify(postService).getAllPosts(eq("user-42"));
    }

    @Test
    void everyPostEndpointRequiresAuth() throws Exception {
        for (String path : List.of("/api/posts/1", "/api/posts/1/versions", "/api/posts/1/preview", "/api/analytics/summary")) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    /** The browser sends this without a token before every cross-origin call from the Vercel frontend. */
    @Test
    void corsPreflightFromTheFrontendSucceedsWithoutAToken() throws Exception {
        mvc.perform(options("/api/posts")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void preflightFromAnUnlistedOriginIsRejected() throws Exception {
        mvc.perform(options("/api/posts")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
