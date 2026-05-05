package com.user.gateway.filter;

import com.user.gateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Custom Gateway Filter to intercept requests and validate JWT.
 */
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final RouteValidator validator;
    private final JwtUtil jwtUtil;

    public AuthenticationFilter(RouteValidator validator, JwtUtil jwtUtil) {
        super(Config.class);
        this.validator = validator;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) -> {
            if (validator.isSecured.test(exchange.getRequest())) {
                String token = null;

                // Try to get token from header
                if (exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                        System.out.println("TOKEN EXTRACTED FROM HEADER");
                    }
                } else {
                    // Try to get token from query param (for WebSockets/SockJS)
                    token = exchange.getRequest().getQueryParams().getFirst("token");
                    if (token != null) {
                        System.out.println("TOKEN EXTRACTED FROM QUERY PARAM: " + token.substring(0, 10) + "...");
                    } else {
                        System.out.println("NO TOKEN FOUND IN QUERY PARAM EITHER");
                    }
                }

                if (token == null) {
                    throw new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE, "Missing authentication token (GATEWAY)");
                }
                
                try {
                    // Validate token
                    jwtUtil.validateToken(token);
                    System.out.println("TOKEN VALIDATED SUCCESSFULLY");
                } catch (Exception e) {
                    System.out.println("TOKEN VALIDATION FAILED: " + e.getMessage());
                    throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Invalid access token (GATEWAY)");
                }
            }
            return chain.filter(exchange);
        });
    }

    public static class Config {
    }
}
