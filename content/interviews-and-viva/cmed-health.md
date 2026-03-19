---
title: "CMED Health - Interview Questions and Answers"
date: "2026-03-17"
tags: ["interviews", "viva", "cmed-health", "backend", "oop", "jwt", "database"]
excerpt: "CMED Health interview questions with clear, practical answers on String Constant Pool, JWT verification, entity relationships, encapsulation, and query optimization."
---

# CMED Health - Interview Questions and Answers

## Question 1: String Constant Pool (SCP)

### Answer

The String Constant Pool is a special memory area in Java where string literals are stored and reused.

- When you write `String a = "hello";`, Java stores `"hello"` in the pool.
- If another literal with the same value appears, Java reuses the same object instead of creating a new one.
- This saves memory and improves performance.

Example:

```java
String a = "hello";
String b = "hello";
System.out.println(a == b); // true (same pooled object)

String c = new String("hello");
System.out.println(a == c); // false (different object in heap)
System.out.println(a.equals(c)); // true (same content)
```

Key point: use `equals()` for content comparison; `==` checks reference identity.

---

## Question 2: JWT - How Do We Verify the Correct User?

### Answer

JWT does not prove identity by itself unless the server verifies it properly. Correct verification includes these steps:

1. The user logs in with credentials.
2. The server validates credentials and issues a signed JWT containing claims like `sub` (user id), `role`, `exp`.
3. On each protected request, the client sends `Authorization: Bearer <token>`.
4. The server verifies:
   - Signature (token was signed by trusted key)
   - Expiration (`exp` not expired)
   - Issuer (`iss`) and audience (`aud`) if used
   - Optional token version / revocation checks
5. After validation, the server trusts the `sub` claim and loads that user context.

Why this confirms the correct user:
- Only the server can create a valid signature.
- Any tampering changes payload and breaks signature verification.
- Expiration and revocation checks prevent indefinite reuse.

Important security note: always use HTTPS and short token lifetimes; refresh tokens should be handled securely.

---

## Question 3: Entity Relationships (Association)

### Answer

Association means one entity is related to another entity in a domain model.

Common relationship types:

- One-to-One: one user has one profile
- One-to-Many: one customer has many orders
- Many-to-One: many orders belong to one customer
- Many-to-Many: many students join many courses

JPA example:

```java
@Entity
class Department {
  @Id
  private Long id;

  @OneToMany(mappedBy = "department")
  private List<Employee> employees;
}

@Entity
class Employee {
  @Id
  private Long id;

  @ManyToOne
  @JoinColumn(name = "department_id")
  private Department department;
}
```

This models a one-to-many association from Department to Employee.

---

## Question 4: Encapsulation - How Is It Implemented?

### Answer

Encapsulation means bundling data and behavior together, while restricting direct access to internal state.

Implementation in OOP:

- Keep fields `private`
- Expose controlled access through public methods (getters/setters/business methods)
- Add validation rules inside methods

Example:

```java
class BankAccount {
  private double balance;

  public double getBalance() {
    return balance;
  }

  public void deposit(double amount) {
    if (amount <= 0) {
      throw new IllegalArgumentException("Amount must be positive");
    }
    balance += amount;
  }

  public void withdraw(double amount) {
    if (amount <= 0 || amount > balance) {
      throw new IllegalArgumentException("Invalid withdrawal");
    }
    balance -= amount;
  }
}
```

Benefit: object state cannot be modified in unsafe ways from outside the class.

---

## Question 5: How Can Queries Be Optimized? (By Association)

### Answer

When associations are involved, poor fetching strategy causes performance issues like the N+1 query problem.

Practical optimization methods:

1. Use proper indexes on foreign keys and frequently filtered columns.
2. Fetch only needed data (projection/DTO), not full entities.
3. Use `JOIN FETCH` for required associations in the same query.
4. Use pagination for large result sets.
5. Avoid loading deep lazy graphs in loops.
6. Batch fetch related entities where possible.

N+1 example and fix:

```java
// Problem: loads orders, then each customer lazily (N+1)
@Query("SELECT o FROM Order o")
List<Order> findAllOrders();

// Better: fetch associated customer in one query
@Query("SELECT o FROM Order o JOIN FETCH o.customer")
List<Order> findAllOrdersWithCustomer();
```

Association-focused answer:
- Model relations correctly.
- Choose lazy/eager strategy intentionally.
- Fetch associations in a controlled way per use case.
- Add indexes on relation columns (`customer_id`, `department_id`, etc.).

That is how association-aware design improves both correctness and query performance.
