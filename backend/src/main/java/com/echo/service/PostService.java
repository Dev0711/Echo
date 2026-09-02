package com.echo.service;

import com.echo.dto.PostAutosaveRequest;
import com.echo.dto.PostCreateRequest;
import com.echo.dto.PostResponse;
import com.echo.dto.PreviewResponse;
import com.echo.dto.PublishRequest;
import com.echo.exception.ResourceNotFoundException;
import com.echo.mapper.PostMapper;
import com.echo.model.Post;
import com.echo.model.PostVersion;
import com.echo.model.PlatformStatus;
import com.echo.platform.common.FormattedContent;
import com.echo.platform.common.PlatformCredentials;
import com.echo.platform.common.PlatformFormatter;
import com.echo.platform.common.PlatformPublisher;
import com.echo.platform.common.PublishResult;
import com.echo.platform.common.ParsedPost;
import com.echo.repository.PostRepository;
import com.echo.repository.PostVersionRepository;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.ast.Node;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.retry.annotation.Retryable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final PostVersionRepository postVersionRepository;
    private final PostMapper postMapper;
    private final List<PlatformFormatter> formatters;
    private final List<PlatformPublisher> publishers;
    private final Parser markdownParser;
    private final PlatformCredentialsProvider credentialsProvider;

    public PostService(PostRepository postRepository,
                       PostVersionRepository postVersionRepository,
                       PostMapper postMapper,
                       List<PlatformFormatter> formatters,
                       List<PlatformPublisher> publishers,
                       PlatformCredentialsProvider credentialsProvider) {
        this.postRepository = postRepository;
        this.postVersionRepository = postVersionRepository;
        this.postMapper = postMapper;
        this.formatters = formatters;
        this.publishers = publishers;
        this.credentialsProvider = credentialsProvider;
        this.markdownParser = Parser.builder().build();
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream()
                .map(PostResponse::from)
                .toList();
    }

    public PostResponse getPost(String id) {
        return postRepository.findById(id)
                .map(PostResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
    }

    public PostResponse createPost(PostCreateRequest request) {
        Post post = postMapper.toEntity(request);
        post = postRepository.save(post);
        return PostResponse.from(post);
    }

    public PostResponse autosave(String id, PostAutosaveRequest request) {
        Post existing = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
        
        Post updated = new Post(
                existing.id(),
                existing.title(),
                request.bodyMarkdown(),
                existing.tags(),
                existing.coverImageUrl(),
                existing.status(),
                existing.sourceUrl(),
                existing.createdAt(),
                LocalDateTime.now(),
                LocalDateTime.now(),
                existing.platforms()
        );
        
        Post saved = postRepository.save(updated);
        saveVersion(saved.id(), request.bodyMarkdown());
        
        return PostResponse.from(saved);
    }

    private void saveVersion(String postId, String bodyMarkdown) {
        PostVersion version = new PostVersion(null, postId, bodyMarkdown, LocalDateTime.now());
        postVersionRepository.save(version);
        
        // Keep only last 20 versions
        List<PostVersion> versions = postVersionRepository.findAllByPostIdOrderBySavedAtDesc(postId);
        if (versions.size() > 20) {
            List<String> toDelete = versions.subList(20, versions.size()).stream()
                    .map(PostVersion::id)
                    .toList();
            postVersionRepository.deleteAllById(toDelete);
        }
    }

    public PreviewResponse preview(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", id));
        
        Node ast = markdownParser.parse(post.bodyMarkdown());
        ParsedPost parsedPost = new ParsedPost(
                post.title(),
                ast,
                post.tags(),
                post.coverImageUrl()
        );
        
        Map<String, FormattedContent> previews = formatters.stream()
                .collect(Collectors.toMap(
                        PlatformFormatter::platformKey,
                        formatter -> formatter.format(parsedPost)
                ));
        
        return PreviewResponse.from(previews);
    }

    public void publish(String postId, PublishRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        
        Node ast = markdownParser.parse(post.bodyMarkdown());
        ParsedPost parsedPost = new ParsedPost(
                post.title(),
                ast,
                post.tags(),
                post.coverImageUrl()
        );
        
        for (String platformKey : request.platforms()) {
            // Check if already published (idempotency)
            PlatformStatus existingStatus = post.platforms().get(platformKey);
            if (existingStatus != null && 
                (existingStatus.status() == PlatformStatus.PlatformPublishStatus.PUBLISHED || 
                 existingStatus.status() == PlatformStatus.PlatformPublishStatus.PENDING)) {
                continue; // Skip already published or pending
            }
            
            PlatformCredentials creds = credentialsProvider.getCredentials(platformKey, request.credentials());
            
            // Publish asynchronously
            publishToPlatformAsync(postId, platformKey, parsedPost, creds);
        }
    }

    @Async
    @Retryable(maxAttempts = 3, backoff = @org.springframework.retry.annotation.Backoff(delay = 2000, multiplier = 2))
    public void publishToPlatformAsync(String postId, String platformKey, ParsedPost parsedPost, PlatformCredentials creds) {
        PlatformFormatter formatter = formatters.stream()
                .filter(f -> f.platformKey().equals(platformKey))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No formatter for platform: " + platformKey));
        
        PlatformPublisher publisher = publishers.stream()
                .filter(p -> p.platformKey().equals(platformKey))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No publisher for platform: " + platformKey));
        
        // Update status to PENDING
        updatePlatformStatus(postId, platformKey, PlatformStatus.PlatformPublishStatus.PENDING, null, null, null, null);
        
        try {
            FormattedContent formattedContent = formatter.format(parsedPost);
            PublishResult result = publisher.publish(formattedContent, creds);
            
            updatePlatformStatus(
                    postId, 
                    platformKey, 
                    result.success() ? PlatformStatus.PlatformPublishStatus.PUBLISHED : PlatformStatus.PlatformPublishStatus.FAILED,
                    result.url(),
                    result.platformId(),
                    result.error(),
                    result.threadIds()
            );
        } catch (Exception e) {
            updatePlatformStatus(
                    postId, 
                    platformKey, 
                    PlatformStatus.PlatformPublishStatus.FAILED,
                    null,
                    null,
                    e.getMessage(),
                    null
            );
        }
    }

    private void updatePlatformStatus(String postId, String platformKey, 
                                      PlatformStatus.PlatformPublishStatus status,
                                      String url, String platformId, String error, 
                                      List<String> threadIds) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));
        
        Map<String, PlatformStatus> platforms = new java.util.HashMap<>(post.platforms());
        PlatformStatus existing = platforms.get(platformKey);
        
        PlatformStatus updated = new PlatformStatus(
                status,
                url,
                platformId,
                status == PlatformStatus.PlatformPublishStatus.PUBLISHED ? LocalDateTime.now() : (existing != null ? existing.publishedAt() : null),
                error,
                threadIds
        );
        
        platforms.put(platformKey, updated);
        
        Post updatedPost = new Post(
                post.id(),
                post.title(),
                post.bodyMarkdown(),
                post.tags(),
                post.coverImageUrl(),
                post.status(),
                post.sourceUrl(),
                post.createdAt(),
                LocalDateTime.now(),
                post.lastAutosavedAt(),
                platforms
        );
        
        postRepository.save(updatedPost);
    }
}