---
title: "Spring Boot Authentication & JWT"
date: "2026-04-21"
tags: ["java", "springboot", "jwt", "authentication", "security"]
excerpt: "Learn how to implement JWT authentication in Spring Boot — from token creation and validation to securing endpoints with a custom JWT filter."
---

# Spring Boot Authentication & JWT

Your REST API is stateless. No sessions, no cookies. The client sends a JSON Web Token with every request, and your server verifies it. No database lookup per request — the token itself proves identity. Here's how to implement JWT in Spring Boot.

## JWT Authentication Flow

```text
1. Client sends POST /api/auth/login with email + password
2. Server validates credentials against database
3. Server creates JWT signed with secret key
4. Server returns JWT to client
5. Client stores JWT and sends it in Authorization header: "Bearer <token>"
6. JWT filter intercepts every request
7. Filter validates token signature + expiry
8. If valid → set authentication in SecurityContext
9. Request proceeds to controller
```

## Implementation

### JWT Utility
```java
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().iterator().next().getAuthority());

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isExpired(token);
    }

    private boolean isExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
```

### Auth Controller
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token));
    }
}
```

### JWT Filter
```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.isTokenValid(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

### Security Config with JWT
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authManager(HttpSecurity http) throws Exception {
        return http.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **JWT** | Signed token containing user identity and expiry |
| **JwtUtil** | Creates and validates JWT tokens |
| **JwtAuthFilter** | Extracts token from header, validates, sets authentication |
| **`Bearer <token>`** | Authorization header format for JWT |
| **Stateless session** | No server-side sessions — token is the session |
| **BCryptPasswordEncoder** | Password hashing algorithm |
| **AuthenticationManager** | Validates username + password credentials |
| **`addFilterBefore`** | Inserts JWT filter before Spring's auth filter |

**JWT authentication in Spring Boot is a filter that checks every request — extract the token, verify the signature, load the user, and set the authentication. The rest of your application doesn't know or care about JWT.**
