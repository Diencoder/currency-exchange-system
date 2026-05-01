package com.user.transaction.exception;

import com.user.common.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;

/**
 * Centralized error handler for Transaction Service.
 * This is an application of "Clean Code" and "Separation of Concerns".
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Hệ thống xảy ra lỗi: ", ex);
        
        ErrorResponse error = ErrorResponse.builder()
                .status("ERROR")
                .message(ex.getMessage())
                .errorCode("TRANSACTION_SYSTEM_ERROR")
                .timestamp(LocalDateTime.now())
                .build();
                
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .status("FAILED")
                .message(ex.getMessage())
                .errorCode("INVALID_INPUT")
                .timestamp(LocalDateTime.now())
                .build();
                
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Bạn có thể thêm các Exception tùy chỉnh khác ở đây (ví dụ: InsufficientBalanceException)
}
