package com.echo.controller;

import com.echo.dto.AiAssistRequest;
import com.echo.dto.AiAssistResponse;
import com.echo.dto.PostAutosaveRequest;
import com.echo.dto.PostCreateRequest;
import com.echo.dto.PostResponse;
import com.echo.dto.PreviewResponse;
import com.echo.dto.PublishRequest;
import com.echo.dto.VersionSummary;
import com.echo.dto.VersionUpdateRequest;
import com.echo.model.PostVersion;
import com.echo.service.AiService;
import com.echo.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@Tag(name = "Posts", description = "Post management endpoints (all scoped to the signed-in user)")
public class PostController {

    private final PostService postService;
    private final AiService aiService;

    public PostController(PostService postService, AiService aiService) {
        this.postService = postService;
        this.aiService = aiService;
    }

    private static String userId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    @Operation(summary = "List my posts")
    public List<PostResponse> getAllPosts(Authentication auth) {
        return postService.getAllPosts(userId(auth));
    }

    @GetMapping("/{id}")
    public PostResponse getPost(@PathVariable String id, Authentication auth) {
        return postService.getPost(userId(auth), id);
    }

    @PostMapping
    @Operation(summary = "Create a new draft")
    public PostResponse createPost(@Valid @RequestBody PostCreateRequest request, Authentication auth) {
        return postService.createPost(userId(auth), request);
    }

    @PatchMapping("/{id}/autosave")
    @Operation(summary = "Autosave post content")
    public PostResponse autosave(@PathVariable String id, @Valid @RequestBody PostAutosaveRequest request,
                                 Authentication auth) {
        return postService.autosave(userId(auth), id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a post and its version history")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        postService.deletePost(userId(auth), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/preview")
    public PreviewResponse preview(@PathVariable String id, Authentication auth) {
        return postService.preview(userId(auth), id);
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish (or schedule) to the selected platforms; also used to retry failed ones")
    public void publish(@PathVariable String id, @Valid @RequestBody PublishRequest request, Authentication auth) {
        postService.publish(userId(auth), id, request);
    }

    @PostMapping("/{id}/unschedule")
    @Operation(summary = "Cancel a scheduled post and return it to drafts")
    public PostResponse unschedule(@PathVariable String id, Authentication auth) {
        return postService.unschedule(userId(auth), id);
    }

    // ── Version history ──────────────────────────────────────────────────────

    @GetMapping("/{id}/versions")
    public List<VersionSummary> getVersions(@PathVariable String id, Authentication auth) {
        return postService.getVersions(userId(auth), id);
    }

    @GetMapping("/{id}/versions/{versionId}")
    public PostVersion getVersion(@PathVariable String id, @PathVariable String versionId, Authentication auth) {
        return postService.getVersion(userId(auth), id, versionId);
    }

    @PostMapping("/{id}/versions")
    @Operation(summary = "Save a named version of the current content")
    public VersionSummary saveVersion(@PathVariable String id, @RequestBody(required = false) Map<String, String> body,
                                      Authentication auth) {
        String label = body == null ? null : body.get("label");
        return VersionSummary.from(postService.saveNamedVersion(userId(auth), id, label));
    }

    @PatchMapping("/{id}/versions/{versionId}")
    public VersionSummary updateVersion(@PathVariable String id, @PathVariable String versionId,
                                        @Valid @RequestBody VersionUpdateRequest request, Authentication auth) {
        return VersionSummary.from(postService.updateVersion(userId(auth), id, versionId, request.label(), request.pinned()));
    }

    @PostMapping("/{id}/versions/{versionId}/restore")
    @Operation(summary = "Restore a version (the current state is saved first, so restoring is undoable)")
    public PostResponse restore(@PathVariable String id, @PathVariable String versionId, Authentication auth) {
        return postService.restoreVersion(userId(auth), id, versionId);
    }

    // ── AI ───────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/ai-assist")
    public AiAssistResponse aiAssist(@PathVariable String id, @RequestBody AiAssistRequest request, Authentication auth) {
        String userId = userId(auth);
        PostResponse post = postService.getPost(userId, id); // also enforces ownership
        String content = request.content() != null && !request.content().isBlank()
                ? request.content() : post.getBodyMarkdown();
        return aiService.assist(userId, request.action(), content, request.context(), request.option());
    }

    @PostMapping("/{id}/ai-checkpoint")
    @Operation(summary = "Save a restore point right before applying an AI edit")
    public ResponseEntity<Void> aiCheckpoint(@PathVariable String id, Authentication auth) {
        postService.checkpointBeforeAi(userId(auth), id);
        return ResponseEntity.noContent().build();
    }
}
