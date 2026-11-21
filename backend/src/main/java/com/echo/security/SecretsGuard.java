package com.echo.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * The defaults in application.yml are public. They are fine for local development, but a
 * production deployment that forgot to set its own secrets must refuse to start.
 */
@Component
public class SecretsGuard {

    private static final Logger log = LoggerFactory.getLogger(SecretsGuard.class);
    static final String DEFAULT_JWT = "echoSecretKey256BitLongEnoughForHS256AlgorithmPleaseChangeInProduction";
    static final String DEFAULT_ENCRYPTION = "EchoAES256KeyMustBe32Characters!";

    private final Environment env;
    private final String jwtSecret;
    private final String encryptionKey;

    public SecretsGuard(Environment env,
                        @Value("${echo.jwt.secret}") String jwtSecret,
                        @Value("${echo.encryption.key}") String encryptionKey) {
        this.env = env;
        this.jwtSecret = jwtSecret;
        this.encryptionKey = encryptionKey;
    }

    @PostConstruct
    void verify() {
        boolean usingDefaults = DEFAULT_JWT.equals(jwtSecret) || DEFAULT_ENCRYPTION.equals(encryptionKey);
        if (!usingDefaults) return;
        if (env.acceptsProfiles(Profiles.of("prod", "production"))) {
            throw new IllegalStateException(
                    "JWT_SECRET and ENCRYPTION_KEY must be set to private values in production.");
        }
        log.warn("Using the built-in development JWT/encryption secrets. Set JWT_SECRET and ENCRYPTION_KEY before deploying.");
    }
}
