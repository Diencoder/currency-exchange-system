package com.user.gateway.filter;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

/**
 * Validator to check if a route requires authentication.
 */
@Component
public class RouteValidator {

    public static final List<String> openApiEndpoints = List.of(
            "/api/users/auth",
            "/api/exchange/rates",
            "/api/notifications/ws/**",
            "/eureka",
            "/v3/api-docs",
            "/swagger-ui"
    );

    public Predicate<ServerHttpRequest> isSecured =
            request -> {
                String path = request.getURI().getPath();
                // If path starts with any open endpoint, it's NOT secured
                return openApiEndpoints
                        .stream()
                        .noneMatch(uri -> path.startsWith(uri) || path.contains(uri));
            };

}
