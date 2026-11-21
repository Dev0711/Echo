package com.echo.exception;

import org.springframework.http.HttpStatus;

/** A failed AI request. Carries the HTTP status to return, so errors are never disguised as "results". */
public class AiException extends RuntimeException {
    private final HttpStatus status;

    public AiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus status() { return status; }
}
