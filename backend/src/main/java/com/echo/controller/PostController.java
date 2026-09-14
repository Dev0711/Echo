package com.echo.controller;

import com.echo.dto.PostAutosaveRequest;
import com.echo.dto.PostCreateRequest;
import com.echo.dto.PostResponse;
import com.echo.dto.PreviewResponse;
import com.echo.dto.PublishRequest;
import com.echo.exception.ResourceNotFoundException;
import com.echo.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@Tag(name = "Posts", description = "Post management endpoints")
public class PostController {

    private final PostService postService;
    private final com.echo.service.GeminiService geminiService;

    public PostController(PostService postService, com.echo.service.GeminiService geminiService) {
        this.postService = postService;
        this.geminiService = geminiService;
    }

    @GetMapping
    @Operation(summary = "Get all posts", description = "Returns a list of all posts")
    public List<PostResponse> getAllPosts() {
        return postService.getAllPosts();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get post by ID", description = "Returns a single post by ID")
    public PostResponse getPost(@PathVariable String id) {
        return postService.getPost(id);
    }

    @PostMapping
    @Operation(summary = "Create a new post", description = "Creates a new post with draft status")
    public PostResponse createPost(@Valid @RequestBody PostCreateRequest request) {
        return postService.createPost(request);
    }

    @PatchMapping("/{id}/autosave")
    @Operation(summary = "Autosave post content", description = "Updates the body markdown of a post without changing status")
    public PostResponse autosave(
            @PathVariable String id,
            @Valid @RequestBody PostAutosaveRequest request) {
        return postService.autosave(id, request);
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Preview post on all platforms", description = "Returns formatted content for each platform")
    public PreviewResponse preview(@PathVariable String id) {
        return postService.preview(id);
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish post to selected platforms", description = "Publishes the post to the specified platforms")
    public void publish(
            @PathVariable String id,
            @Valid @RequestBody PublishRequest request) {
        postService.publish(id, request);
    }

    @GetMapping("/{id}/versions")
    public java.util.List<com.echo.model.PostVersion> getVersions(@PathVariable String id) {
        return postService.getVersions(id);
    }

    @PostMapping("/{id}/ai-assist")
    public com.echo.dto.AiAssistResponse aiAssist(@PathVariable String id, @RequestBody com.echo.dto.AiAssistRequest request) {
        PostResponse post = postService.getPost(id);
        // We'll let the controller call geminiService.assist
        String result = geminiService.assist(request.action(), post.getBodyMarkdown());
        return new com.echo.dto.AiAssistResponse(result);
    }
}
