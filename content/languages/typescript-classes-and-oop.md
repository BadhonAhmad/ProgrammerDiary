---
title: "Classes & OOP in TypeScript"
date: "2025-01-24"
tags: ["typescript", "classes", "oop", "access-modifiers", "abstract"]
excerpt: "Master object-oriented programming in TypeScript — classes, access modifiers, abstract classes, interfaces with implements, and design patterns."
---

# Classes & OOP in TypeScript

TypeScript adds a powerful OOP layer on top of JavaScript classes. With **type annotations, access modifiers, abstract classes, and interface implementation**, you can write robust, well-structured object-oriented code.

## Basic Class with Types

```typescript
class User {
  // Property declarations with types
  name: string;
  age: number;
  email: string;

  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }

  greet(): string {
    return `Hi, I'm ${this.name}, age ${this.age}`;
  }
}

const user = new User("Alice", 25, "alice@example.com");
user.greet(); // "Hi, I'm Alice, age 25"
```

### Parameter Properties (Shorthand)

TypeScript can auto-create properties from constructor parameters:

```typescript
class User {
  constructor(
    public name: string,
    public age: number,
    public email: string,
  ) {}

  greet(): string {
    return `Hi, I'm ${this.name}`;
  }
}
// `public` in constructor → auto-creates & assigns this.name, this.age, this.email
```

## Access Modifiers

Control who can access class members:

```typescript
class BankAccount {
  public owner: string;        // Accessible everywhere (default)
  protected balance: number;   // Accessible in this class + subclasses
  private pin: number;         // Accessible only in this class

  constructor(owner: string, balance: number, pin: number) {
    this.owner = owner;
    this.balance = balance;
    this.pin = pin;
  }

  public getBalance(): number {
    return this.balance;
  }

  public deposit(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.balance += amount;
  }

  // Private method — internal only
  private validatePin(input: number): boolean {
    return input === this.pin;
  }
}

class SavingsAccount extends BankAccount {
  private interestRate: number;

  constructor(owner: string, balance: number, pin: number, interestRate: number) {
    super(owner, balance, pin);
    this.interestRate = interestRate;
  }

  applyInterest(): void {
    // Can access `balance` (protected) from subclass
    this.balance += this.balance * this.interestRate;
    // ❌ Cannot access `pin` (private) from subclass
    // this.pin; // Error!
  }
}

const account = new BankAccount("Alice", 1000, 1234);
account.owner;              // ✅ public
account.balance;            // ❌ protected — not accessible outside
account.pin;                // ❌ private — not accessible outside
account.getBalance();       // ✅ public method
```

### Access Modifier Summary

| Modifier | Class | Subclass | Outside |
|----------|-------|----------|---------|
| `public` | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ❌ |
| `private` | ✅ | ❌ | ❌ |

## `readonly` Properties

```typescript
class Config {
  readonly appName: string;
  readonly version: string;

  constructor(appName: string, version: string) {
    this.appName = appName;     // Can assign in constructor
    this.version = version;
  }

  update(): void {
    this.appName = "new";  // ❌ Cannot reassign readonly
  }
}

const config = new Config("MyApp", "1.0");
config.appName = "Other";  // ❌ Cannot reassign readonly
```

Combine with parameter properties:

```typescript
class Config {
  constructor(
    public readonly appName: string,
    public readonly version: string,
  ) {}
}
```

## Getters & Setters

```typescript
class Temperature {
  private _celsius: number = 0;

  get celsius(): number {
    return this._celsius;
  }

  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error("Temperature below absolute zero!");
    }
    this._celsius = value;
  }

  get fahrenheit(): number {
    return this._celsius * 1.8 + 32;
  }

  set fahrenheit(value: number) {
    this.celsius = (value - 32) / 1.8;
  }
}

const temp = new Temperature();
temp.celsius = 25;
console.log(temp.fahrenheit); // 77
temp.fahrenheit = 100;
console.log(temp.celsius);    // 37.77...
temp.celsius = -300;          // Error: Temperature below absolute zero!
```

## `implements` — Interfaces with Classes

```typescript
interface Printable {
  toString(): string;
}

interface Serializable {
  serialize(): string;
}

// A class can implement multiple interfaces
class User implements Printable, Serializable {
  constructor(
    public name: string,
    public email: string,
  ) {}

  toString(): string {
    return `User(${this.name}, ${this.email})`;
  }

  serialize(): string {
    return JSON.stringify({ name: this.name, email: this.email });
  }
}

const user = new User("Alice", "alice@example.com");
user.toString();    // "User(Alice, alice@example.com)"
user.serialize();   // '{"name":"Alice","email":"alice@example.com"}'
```

### Interface for a Repository Pattern

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(item: Omit<T, "id">): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface Post {
  id: string;
  title: string;
  content: string;
}

class PostRepository implements Repository<Post> {
  async findById(id: string): Promise<Post | null> {
    // Database query...
    return null;
  }

  async findAll(): Promise<Post[]> {
    // Database query...
    return [];
  }

  async create(item: Omit<Post, "id">): Promise<Post> {
    const post: Post = { id: crypto.randomUUID(), ...item };
    return post;
  }

  async update(id: string, item: Partial<Post>): Promise<Post> {
    // Update logic...
    return { id, title: "", content: "", ...item };
  }

  async delete(id: string): Promise<void> {
    // Delete logic...
  }
}
```

## Abstract Classes

Abstract classes are **base classes that cannot be instantiated**. They define a contract that subclasses must implement:

```typescript
abstract class Shape {
  constructor(public color: string) {}

  // Abstract method — subclasses MUST implement
  abstract area(): number;
  abstract perimeter(): number;

  // Concrete method — subclasses inherit this
  describe(): string {
    return `${this.color} shape — area: ${this.area().toFixed(2)}, perimeter: ${this.perimeter().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(
    color: string,
    public radius: number,
  ) {
    super(color);
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(
    color: string,
    public width: number,
    public height: number,
  ) {
    super(color);
  }

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

const circle = new Circle("red", 5);
circle.describe(); // "red shape — area: 78.54, perimeter: 31.42"

const rect = new Rectangle("blue", 4, 6);
rect.describe();   // "blue shape — area: 24.00, perimeter: 20.00"

// Cannot instantiate abstract class
new Shape("green"); // ❌ Error: Cannot create an instance of an abstract class
```

### Abstract Class vs Interface

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Has implementation | Yes (partial) | No |
| Can be instantiated | No | N/A |
| Constructor | Yes | No |
| Access modifiers | Yes | No |
| Multiple inheritance | Single | Multiple (`implements`) |
| Runtime existence | Yes | No (erased) |
| Use when | Sharing code + contract | Just a contract |

## Static Members

```typescript
class MathUtils {
  static PI: number = 3.14159;

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

MathUtils.PI;                    // 3.14159
MathUtils.clamp(150, 0, 100);   // 100
MathUtils.randomBetween(1, 6);  // Random 1-6

// Cannot access static from instance
const utils = new MathUtils();
utils.PI; // ❌ Property 'PI' does not exist on instance
```

### Static Blocks (TypeScript 5.x)

```typescript
class Config {
  static readonly settings: Map<string, string>;

  static {
    // Runs once when the class is initialized
    Config.settings = new Map([
      ["ENV", process.env.NODE_ENV ?? "development"],
      ["PORT", process.env.PORT ?? "3000"],
    ]);
  }
}
```

## Index Signatures in Classes

```typescript
class Dictionary<T> {
  [key: string]: T | undefined;

  set(key: string, value: T): void {
    this[key] = value;
  }

  get(key: string): T | undefined {
    return this[key];
  }
}

const dict = new Dictionary<number>();
dict.set("age", 25);
dict.get("age"); // 25
```

## Design Patterns in TypeScript

### Singleton

```typescript
class Database {
  private static instance: Database | null = null;

  private constructor(private connectionString: string) {}

  static getInstance(connectionString?: string): Database {
    if (!Database.instance) {
      Database.instance = new Database(connectionString ?? "default");
    }
    return Database.instance;
  }

  query(sql: string): string {
    return `Executing: ${sql} on ${this.connectionString}`;
  }
}

const db = Database.getInstance("postgres://localhost/mydb");
new Database("..."); // ❌ Constructor is private
```

### Builder Pattern

```typescript
class QueryBuilder {
  private table: string = "";
  private conditions: string[] = [];
  private orderField: string = "";
  private limitCount: number = 0;

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  orderBy(field: string): this {
    this.orderField = field;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  build(): string {
    let query = `SELECT * FROM ${this.table}`;
    if (this.conditions.length) query += ` WHERE ${this.conditions.join(" AND ")}`;
    if (this.orderField) query += ` ORDER BY ${this.orderField}`;
    if (this.limitCount) query += ` LIMIT ${this.limitCount}`;
    return query;
  }
}

const query = new QueryBuilder()
  .from("users")
  .where("active = true")
  .where("age > 18")
  .orderBy("name")
  .limit(10)
  .build();
// "SELECT * FROM users WHERE active = true AND age > 18 ORDER BY name LIMIT 10"
```

## Best Practices

1. **Use `interface` for contracts, `abstract class` for shared code** — Prefer interfaces unless you need method bodies
2. **Use parameter properties** — Less boilerplate: `constructor(public name: string)`
3. **Prefer `private` by default** — Expose only what's needed via public methods
4. **Use `readonly` for immutable properties** — Especially IDs and configuration
5. **Use `implements` to enforce contracts** — Makes your architecture explicit
6. **Keep classes focused** — Single responsibility principle
7. **Don't overuse inheritance** — Prefer composition over deep class hierarchies
