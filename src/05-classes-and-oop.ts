// ============================================================
// 05 — CLASSES, OOP & DECORATORS
// Run: npx tsx src/05-classes-and-oop.ts
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. Class Basics — C# Developer's Perspective");
// ────────────────────────────────────────────────────────────

class Animal {
  // Parameter properties — constructor args become class properties
  constructor(
    public name: string,           // creates this.name
    protected species: string,     // creates this.species (child access only)
    private _sound: string,        // creates this._sound (private)
  ) {}

  // Getter/setter — like C# properties
  get sound(): string { return this._sound; }
  set sound(val: string) { this._sound = val.toLowerCase(); }

  speak(): string {
    return `${this.name} says ${this._sound}`;
  }

  // Static method
  static create(name: string): Animal {
    return new Animal(name, "Unknown", "...");
  }
}

const dog = new Animal("Rex", "Canine", "Woof");
console.log(dog.speak());
console.log("Getter:", dog.sound);
dog.sound = "BARK";                 // setter lowercases it
console.log("After setter:", dog.sound);

const unknown = Animal.create("Mystery");
console.log("Static factory:", unknown.speak());

// ────────────────────────────────────────────────────────────
section("2. Inheritance & Abstract Classes");
// ────────────────────────────────────────────────────────────

abstract class Shape {
  abstract area(): number;          // must be implemented by subclass
  abstract perimeter(): number;

  // Concrete method — shared by all shapes
  describe(): string {
    return `Area: ${this.area().toFixed(2)}, Perimeter: ${this.perimeter().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(public radius: number) { super(); }

  area(): number { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(public width: number, public height: number) { super(); }

  area(): number { return this.width * this.height; }
  perimeter(): number { return 2 * (this.width + this.height); }
}

const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(s => console.log(`  ${s.constructor.name}: ${s.describe()}`));

// ────────────────────────────────────────────────────────────
section("3. Interfaces as Contracts (implements)");
// ────────────────────────────────────────────────────────────

interface Serializable {
  serialize(): string;
}

interface Loggable {
  log(): void;
}

// Multiple interface implementation — like C#
class Config implements Serializable, Loggable {
  constructor(
    public host: string,
    public port: number,
  ) {}

  serialize(): string {
    return JSON.stringify({ host: this.host, port: this.port });
  }

  log(): void {
    console.log(`  Config: ${this.host}:${this.port}`);
  }
}

const cfg = new Config("localhost", 3000);
cfg.log();
console.log("  Serialized:", cfg.serialize());

// ────────────────────────────────────────────────────────────
section("4. ⚠️ GOTCHA: Structural Typing — No Nominal Classes");
// ────────────────────────────────────────────────────────────

class Cat { constructor(public name: string) {} }
class Dog2 { constructor(public name: string) {} }

// In C#: Cat ≠ Dog — nominal typing. In TS: Cat === Dog if same shape!
const kitty: Cat = new Dog2("Rex");   // ✅ compiles — same structure
console.log("A Dog assigned to Cat variable:", kitty.name, "→ works because same shape");
console.log("instanceof Cat?", kitty instanceof Cat);    // false — runtime knows!
console.log("instanceof Dog2?", kitty instanceof Dog2);  // true

// 🔍 DEBUGGER: inspect `kitty` — at runtime it's a Dog, but TS sees Cat

// ────────────────────────────────────────────────────────────
section("5. ⚠️ GOTCHA: `this` Binding in Classes");
// ────────────────────────────────────────────────────────────

class Button {
  label = "Submit";

  // ❌ Regular method: `this` is lost when passed as callback
  handleClickBroken() {
    return `Clicked: ${this?.label ?? "UNDEFINED — this is lost!"}`;
  }

  // ✅ Arrow property: captures `this` from constructor
  handleClickFixed = () => {
    return `Clicked: ${this.label}`;
  };
}

const btn = new Button();

// Direct call — both work
console.log("Direct call (regular):", btn.handleClickBroken());
console.log("Direct call (arrow):", btn.handleClickFixed());

// Extracted as callback — regular breaks!
const extractedBroken = btn.handleClickBroken;
const extractedFixed = btn.handleClickFixed;

console.log("\nExtracted callback (regular):", extractedBroken());   // UNDEFINED!
console.log("Extracted callback (arrow):", extractedFixed());        // works

// 🔍 DEBUGGER: step into both extracted calls — watch `this` differ

// ────────────────────────────────────────────────────────────
section("6. Private Fields — Compile-time vs Runtime");
// ────────────────────────────────────────────────────────────

class Account {
  private balance: number;          // TS private: compile-time only
  #secret: string;                  // ES2022 #private: true runtime privacy

  constructor(balance: number, secret: string) {
    this.balance = balance;
    this.#secret = secret;
  }

  getInfo() {
    return { balance: this.balance, secret: this.#secret };
  }
}

const acct = new Account(1000, "my-secret-key");

// ⚠️ GOTCHA: TS `private` is visible at runtime
console.log("TS private leaks at runtime:", (acct as any).balance);      // 1000!
console.log("ES2022 #private is truly hidden:", (acct as any).secret);   // undefined
console.log("Actual info:", acct.getInfo());

// 🔍 DEBUGGER: inspect `acct` — #secret is not enumerable

// ────────────────────────────────────────────────────────────
section("7. Decorators — Stage 3 (TS 5.0+)");
// ────────────────────────────────────────────────────────────

// Class decorator — runs when class is defined
function registerService(target: Function, _context: ClassDecoratorContext) {
  console.log(`  @registerService → registered: ${target.name}`);
}

// Method decorator — wraps the method
function logCalls(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);
  return function (this: any, ...args: any[]) {
    console.log(`  @logCalls → ${methodName}(${args.join(", ")})`);
    const result = (target as any).apply(this, args);
    console.log(`  @logCalls → ${methodName} returned: ${result}`);
    return result;
  };
}

// Decorator factory — returns a decorator (like parameterized attributes in C#)
function minValue(min: number) {
  return function (
    target: Function,
    context: ClassMethodDecoratorContext
  ) {
    return function (this: any, ...args: any[]) {
      const result = (target as any).apply(this, args);
      if (typeof result === "number" && result < min) {
        throw new Error(`${String(context.name)} returned ${result}, min is ${min}`);
      }
      return result;
    };
  };
}

@registerService
class Calculator {
  @logCalls
  add(a: number, b: number): number {
    return a + b;
  }

  @logCalls
  @minValue(0)
  subtract(a: number, b: number): number {
    return a - b;
  }
}

const calc = new Calculator();
console.log("\nCalling calc.add(2, 3):");
calc.add(2, 3);

console.log("\nCalling calc.subtract(5, 3):");
calc.subtract(5, 3);

console.log("\nCalling calc.subtract(3, 10) — should throw:");
try {
  calc.subtract(3, 10);  // returns -7, below min 0
} catch (err) {
  console.log("  Caught:", (err as Error).message);
}

// ────────────────────────────────────────────────────────────
section("8. Decorator — Timing (Real-World)");
// ────────────────────────────────────────────────────────────

function timed(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  return async function (this: any, ...args: any[]) {
    const start = performance.now();
    const result = await (target as any).apply(this, args);
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`  ⏱ ${String(context.name)} took ${elapsed}ms`);
    return result;
  };
}

class DataService {
  @timed
  async fetchAll(): Promise<string[]> {
    await new Promise(r => setTimeout(r, 150));
    return ["item1", "item2", "item3"];
  }

  @timed
  async fetchById(id: number): Promise<string> {
    await new Promise(r => setTimeout(r, 75));
    return `item-${id}`;
  }
}

const svc = new DataService();
console.log("Result:", await svc.fetchAll());
console.log("Result:", await svc.fetchById(42));

// ────────────────────────────────────────────────────────────
section("9. Builder Pattern (Typed Fluent API)");
// ────────────────────────────────────────────────────────────

interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  body?: string;
  timeout: number;
}

class RequestBuilder {
  private config: Partial<RequestConfig> = {
    method: "GET",
    headers: {},
    timeout: 5000,
  };

  url(url: string): this {
    this.config.url = url;
    return this;                    // return `this` for chaining
  }

  method(m: RequestConfig["method"]): this {
    this.config.method = m;
    return this;
  }

  header(key: string, value: string): this {
    this.config.headers![key] = value;
    return this;
  }

  body(data: object): this {
    this.config.body = JSON.stringify(data);
    this.config.headers!["Content-Type"] = "application/json";
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  build(): RequestConfig {
    if (!this.config.url) throw new Error("URL is required");
    return this.config as RequestConfig;
  }
}

const request = new RequestBuilder()
  .url("https://api.example.com/users")
  .method("POST")
  .header("Authorization", "Bearer token123")
  .body({ name: "Tom", role: "lead" })
  .timeout(3000)
  .build();

console.log("Built request:", JSON.stringify(request, null, 2));

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Try adding your own decorators and builders.\n${"═".repeat(60)}`);
