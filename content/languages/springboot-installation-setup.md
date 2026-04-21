---
title: "Spring Boot Installation & Setup"
date: "2026-04-21"
tags: ["java", "springboot", "setup", "installation", "getting-started"]
excerpt: "Get a Spring Boot project running in under 5 minutes — from JDK installation to your first API endpoint with auto-configuration in action."
---

# Spring Boot Installation & Setup

Five minutes from zero to a running API. No XML, no server installation, no manual configuration. Generate a project, write a controller, run it. That's the Spring Boot way.

## Prerequisites

```text
Java 17 or higher (Java 21 recommended)

Check your version:
  java --version
  # java 21.0.x → good to go

Install JDK if needed:
  SDKMAN (recommended): sdk install java 21.0.3-tem
  Or download from adoptium.net
```

## Option 1: Spring Initializr (Fastest)

```text
1. Go to start.spring.io
2. Choose:
   Project:    Maven (or Gradle)
   Language:   Java
   Spring Boot: 3.x (latest stable)
   Group:      com.example
   Artifact:   my-app
   Packaging:  Jar
   Java:       17+

3. Add dependencies:
   Spring Web          (for REST APIs)
   Spring Data JPA     (for database)
   PostgreSQL Driver   (or H2 for testing)
   Spring Boot DevTools (hot reload during development)

4. Click Generate → download and unzip the project
```

## Option 2: CLI

```bash
# Install Spring Boot CLI
sdk install springboot

# Create a new project
spring init --dependencies=web,data-jpa,postgresql my-app
cd my-app
```

## Option 3: IDE

```text
IntelliJ IDEA:
  File → New → Project → Spring Initializr
  Select dependencies → Create

VS Code:
  Install "Spring Boot Extension Pack"
  Ctrl+Shift+P → "Spring Initializr: Generate"
```

## Your First API

### Project Structure

```text
my-app/
├── src/
│   ├── main/
│   │   ├── java/com/example/myapp/
│   │   │   ├── MyAppApplication.java    # Entry point
│   │   │   ├── controller/
│   │   │   │   └── HelloController.java
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   └── resources/
│   │       ├── application.properties   # Configuration
│   │       ├── static/                  # Static files
│   │       └── templates/              # View templates
│   └── test/
│       └── java/com/example/myapp/
├── pom.xml                              # Maven dependencies
└── mvnw                                 # Maven wrapper (no Maven needed)
```

### The Entry Point

```java
// MyAppApplication.java — auto-generated
package com.example.myapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyAppApplication.class, args);
    }
}
```

### Your First Controller

```java
// controller/HelloController.java
package com.example.myapp.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }

    @GetMapping("/greet/{name}")
    public String greet(@PathVariable String name) {
        return "Hello, " + name + "!";
    }
}
```

### Run the Application

```bash
# Using Maven wrapper (no Maven installation needed)
./mvnw spring-boot:run

# Or from IDE: run MyAppApplication.main()
```

```text
Server starts at: http://localhost:8080

Test it:
  http://localhost:8080/api/hello        → "Hello, Spring Boot!"
  http://localhost:8080/api/greet/Alice   → "Hello, Alice!"
```

## Key Configuration

```properties
# application.properties

# Server
server.port=8080

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/mydb
spring.datasource.username=user
spring.datasource.password=password

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Logging
logging.level.com.example.myapp=DEBUG
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **start.spring.io** | Generate a Spring Boot project with selected dependencies |
| **`@SpringBootApplication`** | Entry point — enables auto-config, component scanning |
| **`@RestController`** | Marks a class as a REST API controller |
| **`@GetMapping`** | Maps HTTP GET requests to a method |
| **`application.properties`** | Central configuration file for all settings |
| **Maven wrapper (`mvnw`)** | Run builds without installing Maven globally |
| **DevTools** | Auto-restart on code changes during development |

**Spring Boot's setup proves its philosophy: generate a project, write a controller, run it. No configuration ceremony, no server installation, no XML — just code.**
