package com.echo.repository;

import com.echo.model.PlatformCredential;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformCredentialRepository extends MongoRepository<PlatformCredential, String> {
    List<PlatformCredential> findAllByUserId(String userId);
    Optional<PlatformCredential> findByUserIdAndPlatform(String userId, String platform);
    void deleteByUserIdAndPlatform(String userId, String platform);
}
