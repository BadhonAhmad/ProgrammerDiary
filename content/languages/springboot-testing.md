---
title: "Spring Boot Testing"
date: "2026-04-21"
tags: ["java", "springboot", "testing", "junit", "mockito"]
excerpt: "Learn how to test Spring Boot applications — from unit tests to integration tests with embedded databases, mocked dependencies, and test slices."
---

# Spring Boot Testing

You change the User entity, add a required field, and deploy. The create-user endpoint returns a 500 — you forgot to update the service. A test would have caught it in 2 seconds. Spring Boot makes testing so easy there's no excuse to skip it.

## Testing Levels

```text
Unit test:        Test one class in isolation (mock dependencies)
Integration test:  Test multiple components together (real database)
Slice test:       Test one layer (controller, repository, service)

Speed:     Unit > Slice > Integration
Coverage:  Integration > Slice > Unit
```

## Setup

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<!-- Includes: JUnit 5, Mockito, AssertJ, Spring Test -->
```

## Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void getUserById_returnsUser() {
        // Arrange
        User user = new User(1L, "Alice", "alice@test.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        UserResponse result = userService.getUserById(1L);

        // Assert
        assertThat(result.name()).isEqualTo("Alice");
        assertThat(result.email()).isEqualTo("alice@test.com");
    }

    @Test
    void getUserById_notFound_throwsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

## Controller Tests (@WebMvcTest)

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getUser_returns200() throws Exception {
        UserResponse user = new UserResponse(1L, "Alice", "alice@test.com");
        when(userService.getUserById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Alice"))
            .andExpect(jsonPath("$.email").value("alice@test.com"));
    }

    @Test
    void createUser_validRequest_returns201() throws Exception {
        UserResponse user = new UserResponse(1L, "Alice", "alice@test.com");
        when(userService.createUser(any())).thenReturn(user);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Alice\",\"email\":\"alice@test.com\",\"password\":\"secret123\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Alice"));
    }
}
```

## Repository Tests (@DataJpaTest)

```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByEmail_returnsUser() {
        User user = new User(null, "Alice", "alice@test.com", "hashed", true);
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByEmail("alice@test.com");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alice");
    }

    @Test
    void existsByEmail_correctlyChecks() {
        User user = new User(null, "Alice", "alice@test.com", "hashed", true);
        entityManager.persistAndFlush(user);

        assertThat(userRepository.existsByEmail("alice@test.com")).isTrue();
        assertThat(userRepository.existsByEmail("other@test.com")).isFalse();
    }
}
```

## Integration Tests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void createUser_andRetrieveIt() {
        // Create
        UserRequest request = new UserRequest("Alice", "alice@test.com", "secret123");
        ResponseEntity<UserResponse> createResponse = restTemplate.postForEntity(
            "/api/users", request, UserResponse.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long id = createResponse.getBody().id();

        // Retrieve
        ResponseEntity<UserResponse> getResponse = restTemplate.getForEntity(
            "/api/users/" + id, UserResponse.class);

        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().name()).isEqualTo("Alice");
    }
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`@ExtendWith(MockitoExtension.class)`** | Unit test with mocked dependencies |
| **`@WebMvcTest`** | Test controller layer only (MockMvc) |
| **`@DataJpaTest`** | Test repository layer with embedded DB |
| **`@SpringBootTest`** | Full integration test — entire context |
| **`@MockBean`** | Replace a real bean with a Mockito mock |
| **`MockMvc`** | Test controllers without starting HTTP server |
| **`TestRestTemplate`** | Make real HTTP calls to test server |
| **`TestEntityManager`** | JPA entity manager for test data setup |

**Spring Boot gives you a test slice for every layer — mock dependencies for unit tests, embedded databases for JPA tests, and full context for integration. No excuses for untested code.**
