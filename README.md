# TypeScript Refresher 
I don't use TypeScript day-to-day, compared to C# or Python. Whenever I let too many months pass, I use this refresher to quickly look up syntax samples.

With AI coding assistants, this may not be as necessary anymore — but I believe that to orchestrate agents well, you need to understand the code they're generating, even if you're only reviewing the critical paths and most impactful logic. If that resonates, hopefully you'll find this refresher useful too.


## Quick Start

```bash
npm install
npm run 01          # run a single file
npm run all         # run everything
npx tsx src/04-async-and-promises.ts   # run any file directly
```

## Debug in VS Code

1. Open this folder in VS Code
2. Set breakpoints in any `.ts` file
3. Open the file you want to debug
4. Press `F5` or use **Run > Start Debugging**
5. Select "Node.js" if prompted — `tsx` handles TS natively

Or add this to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [{
    "type": "node",
    "request": "launch",
    "name": "Debug Current TS File",
    "runtimeExecutable": "npx",
    "runtimeArgs": ["tsx", "${file}"],
    "console": "integratedTerminal",
    "skipFiles": ["<node_internals>/**"]
  }]
}
```

## Files

| File | Topics |
|---|---|
| `01-primitives-and-types.ts` | Inference, numbers, arrays, tuples, enums, unions, intersections, literals, discriminated unions, narrowing, `satisfies`, excess properties, readonly |
| `02-functions-and-generics.ts` | Signatures, void gotcha, overloads, generics, constraints, `keyof`, utility types, mapped types |
| `03-loops-and-iteration.ts` | `for`, `for...of`, `for...in` gotchas, `while`, `forEach` caveats, async+forEach trap, `map`/`filter`/`reduce`, Map/Set, `noUncheckedIndexedAccess` |
| `04-async-and-promises.ts` | Promise creation, async/await, error handling, `Promise.all`/`allSettled`/`race`/`any`, sequential vs parallel, typed fetch, AbortController, retry pattern |
| `05-classes-and-oop.ts` | Parameter properties, inheritance, abstract classes, interfaces, structural typing gotcha, `this` binding, `#private` fields, Stage 3 decorators, timing decorator, builder pattern |
| `06-advanced-types.ts` | Conditional types, `infer`, discriminated union state machines, exhaustiveness, template literal types, branded/nominal types, mapped types, type guards, assertion functions, `as const` enums |
| `07-error-handling.ts` | `unknown` catch, custom error hierarchy, `Result<T>` pattern, pipeline chaining, discriminated union errors, `Error.cause` |
| `08-modules-and-patterns.ts` | ESM exports, dynamic imports, declaration files, repository pattern, typed event emitter, middleware pipeline, type-safe config, composable validators |


## The write-up: TypeScript Refresher — For JS/C# Devs


### 1. Primitives & Declarations

The primitive types are `string`, `number`, `boolean`, `bigint`, `symbol`, `null`, and `undefined`. Unlike C#, there is no `int` vs `float` — all numbers are `number`. TypeScript's compiler infers types from assigned values, so explicit annotations are rarely needed; prefer `let x = 5` over `let x: number = 5`. A `const` declaration infers the narrowest possible *literal type* (e.g., `3000` instead of `number`), which matters when passing values to functions expecting specific literals. Arrays use `T[]` syntax. Tuples (`[string, number]`) enforce types at each position but don't enforce length at runtime — `.push()` still works. Enums can be numeric (auto-incrementing from 0) or string-valued; prefer string enums or `as const` objects because numeric enums silently accept any number at runtime.

```ts
// Explicit typing (rarely needed — prefer inference)
let name: string = "Jaime";
let age: number = 42;            // no int/float distinction — it's all number
let active: boolean = true;
let big: bigint = 100n;          // suffix with n
let id: symbol = Symbol("id");
let nothing: null = null;
let nope: undefined = undefined;

// ✅ Prefer: let the compiler infer
let name = "Jaime";              // inferred as string
const PORT = 3000;               // inferred as literal type 3000, not number

// Arrays
let nums: number[] = [1, 2, 3];  // preferred syntax
let nums: Array<number>;         // generic form — same thing

// Tuples (fixed-length, typed positions — no C# equivalent in JS)
let pair: [string, number] = ["age", 42];
let [label, value] = pair;       // destructure works

// Enums
enum Direction { Up, Down, Left, Right }       // numeric (0,1,2,3)
enum Status { Active = "ACTIVE", Idle = "IDLE" } // string enum — prefer this

// ⚠️ GOTCHA: numeric enums allow reverse mapping AND accept any number at runtime
Direction[0];          // "Up" — reverse lookup works
let d: Direction = 99; // NO compile error! 

// ✅ Best practice: use const enum or string enums to avoid surprises
const enum Color { Red, Green, Blue } // inlined at compile time, no runtime object
```

---

### 2. Type System Essentials

TypeScript supports unions (`A | B` — value is one or the other) and intersections (`A & B` — value has all properties of both). Literal types constrain a value to specific strings or numbers, acting as lightweight enums. Interfaces and type aliases both define object shapes, but interfaces can be extended and auto-merge across declarations; types cannot merge but support unions, intersections, and mapped types. Use `interface` for public APIs and object shapes that others may extend; use `type` for unions, intersections, computed types, and utility type work. Properties can be marked `readonly` (immutable after creation) or optional with `?`. Type assertions (`as T`) tell the compiler to trust you — they perform zero runtime checks, so prefer narrowing (`if` checks) over assertions whenever possible.

```ts
// Union & Intersection
type Id = string | number;                         // either
type Employee = Person & { employeeId: number };   // both

// Literal types
type Theme = "light" | "dark";   // like a string enum but lighter weight

// Type aliases vs Interfaces
type Point = { x: number; y: number };             // type alias
interface Point { x: number; y: number }           // interface — extendable

// ⚠️ GOTCHA: interfaces merge, types don't
interface Config { debug: boolean }
interface Config { verbose: boolean }  // ✅ merges into { debug; verbose }
// type Config = ...  ← second declaration would ERROR

// ✅ Best practice:
//   - interface for public APIs / objects that may be extended
//   - type for unions, intersections, mapped types, utility types

// Optional & Readonly
interface User {
  readonly id: string;           // immutable after creation
  name: string;
  email?: string;                // optional (string | undefined)
}

// Assertion / Casting (use sparingly)
const input = document.getElementById("name") as HTMLInputElement;
const input = <HTMLInputElement>document.getElementById("name"); // same — avoid in JSX

// Non-null assertion (tells compiler "trust me, not null")
const el = document.getElementById("app")!;  // ⚠️ throws at runtime if actually null

// ✅ Best practice: prefer narrowing over assertion
const el = document.getElementById("app");
if (el) { /* el is non-null here — compiler knows */ }
```

---

### 3. Functions

Functions annotate parameter types and optionally the return type (the compiler infers return types well, so annotate only when the inference would be too wide or for public API clarity). Parameters can be optional (`?`), have defaults (`= value`), or collect extras with rest syntax (`...args: T[]`).  For overloads you write multiple declaration signatures above a single implementation, but the implementation signature is not directly callable; callers only see the declared overloads. Watch out for `void`: it means "don't use the return value," not "returns undefined." A `void`-returning callback *can* return a value (it's silently ignored), which is why `forEach(n => arr.push(n))` compiles even though `push` returns a number.

```ts
// Typed params + return
function add(a: number, b: number): number { return a + b; }

// Arrow (return type inferred)
const add = (a: number, b: number) => a + b;

// Optional / Default / Rest
function greet(name: string, greeting = "Hello", ...tags: string[]): string {
  return `${greeting}, ${name} [${tags.join(", ")}]`;
}

// Overloads (like C# but declaration-only signatures)
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): string | number {
  return typeof input === "string" ? Number(input) : String(input);
}

// ⚠️ GOTCHA: void ≠ undefined
function log(msg: string): void {}   // void = "don't use return value"
// A void-returning callback CAN return a value — it's just ignored
const arr: number[] = [];
[1,2,3].forEach(n => arr.push(n));   // push returns number, but forEach expects void — OK
```

---

### 4. Generics

Generics let you write functions, classes, and types that work with any type while preserving type safety — like C# generics. The type parameter `<T>` is usually inferred from the argument, so explicit `<string>` is rarely needed. Constraints (`T extends SomeType`) restrict what types are valid. Use `keyof T` to constrain a parameter to the actual property names of another type — the compiler enforces this at call sites. In `.tsx` files (React), arrow function generics need a trailing comma (`<T,>`) to avoid ambiguity with JSX tags.

```ts
function identity<T>(arg: T): T { return arg; }
identity<string>("hello");       // explicit
identity("hello");               // inferred ✅

// Constraints
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

// Multiple type params
function merge<A, B>(a: A, b: B): A & B {
  return { ...a, ...b };
}

// Generic interfaces/types
interface ApiResponse<T> {
  data: T;
  status: number;
}

// ⚠️ GOTCHA: arrow generics in .tsx files need trailing comma
const identity = <T,>(arg: T): T => arg;  // comma disambiguates from JSX
```

---

### 5. Loops and array methods

TypeScript has five loop forms, each with distinct behavior. `for` (classic) is best when you need the index or a non-standard step. `for...of` iterates *values* and is the preferred choice for arrays — it supports `break`, `continue`, and `await`. `for...in` iterates *string keys* including the prototype chain, so never use it on arrays — only on plain objects. `while`/`do...while` work as expected. `forEach` is concise but can't `break`, can't `continue` (only `return` to skip, which is misleading), and critically, it does not `await` — an `async` callback inside `forEach` fires all iterations in parallel and the `forEach` itself returns `void` immediately. Use `for...of` for sequential async work and `Promise.all(items.map(...))` for intentional parallelism. Functional methods (`map`, `filter`, `reduce`, `find`, `some`, `every`) return new values rather than mutating — chain them for declarative transforms.

map: 1:1 transform, `map<U>(fn: (item: T) => U): U[]`.  filter: returns array wiith elements where callback is true, `reduce<U>(fn: (acc: U, item: T) => U, initial: U): U`. reduce collapses array into single value `reduce<U>(fn: (acc: U, item: T) => U, initial: U): U`**  , find returns first element matching the condition or undefined: `find(fn: (item: T) => boolean): T | undefined`, some returns true if any element meets condition, every: true if all elements meet condition.  All these functions are non-mutating, they return new values leaving opriginal unchanged. 

```ts
const items = [10, 20, 30];

// --- for (classic) — use when you need the index or early exit ---
for (let i = 0; i < items.length; i++) { }

// --- for...of (values) — ✅ preferred for arrays ---
for (const val of items) { }            // 10, 20, 30
for (const [i, val] of items.entries()) { }  // index + value

// --- for...in (keys) — ⚠️ only for objects, NOT arrays ---
const obj = { a: 1, b: 2 };
for (const key in obj) { }              // "a", "b" (strings!)

// ⚠️ GOTCHA: for...in on arrays iterates STRING indices AND prototype chain
// NEVER use for...in on arrays

// --- while / do...while ---
let i = 0;
while (i < 10) { i++; }
do { i--; } while (i > 0);

// --- forEach (array method) — no break/continue/await support ---
items.forEach((val, idx) => { });

// ⚠️ GOTCHA: forEach ignores return values and can't break
items.forEach(async (item) => { 
  await fetch(item);  // ❌ fires all in parallel, doesn't await sequentially
});

// ✅ Best practice: use for...of when you need break, continue, or await
for (const item of items) {
  await fetch(item);  // ✅ sequential
}

// --- Functional iteration (map/filter/reduce) ---
const doubled = items.map(n => n * 2);
const evens = items.filter(n => n % 2 === 0);
const sum = items.reduce((acc, n) => acc + n, 0);

// Map & Set iteration
const map = new Map([["a", 1], ["b", 2]]);
for (const [key, val] of map) { }

const set = new Set([1, 2, 3]);
for (const val of set) { }
```

---

### 6. Async / Promises

A `Promise<T>` represents a value that will be available in the future — equivalent to `Task<T>` in C#. You create them with `new Promise<T>((resolve, reject) => ...)` and consume them with `.then()/.catch()/.finally()`, though `async`/`await` is preferred for readability. An `async` function always returns a `Promise`, even if the body returns a plain value. `Promise.all` runs multiple promises in parallel and fails fast on the first rejection. `Promise.allSettled` never rejects — it returns the outcome (fulfilled or rejected) of every promise. `Promise.race` resolves or rejects with whichever promise settles first; `Promise.any` resolves with the first success and only rejects if all fail. For sequential async work in a loop, use `for...of` with `await`; for parallel, use `Promise.all(items.map(...))`. Unhandled rejections crash Node and silently fail in browsers — always catch at the top level. `AbortController` lets you cancel in-flight requests by passing its `signal` to `fetch`.

```ts
// --- Creating a Promise ---
const fetchData = new Promise<string>((resolve, reject) => {
  setTimeout(() => resolve("done"), 1000);
  // reject(new Error("fail"));
});

// --- Consuming ---
fetchData
  .then(data => console.log(data))
  .catch(err => console.error(err))
  .finally(() => console.log("cleanup"));

// --- async/await (preferred) ---
async function load(): Promise<string> {
  const res = await fetch("/api/data");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();                    // return type is Promise<any> from json()
}

// ⚠️ GOTCHA: async functions ALWAYS return a Promise
async function getValue(): Promise<number> { return 42; }
// typeof getValue() is Promise<number>, not number

// --- Parallel execution ---
const [users, posts] = await Promise.all([
  fetch("/users").then(r => r.json()),
  fetch("/posts").then(r => r.json()),
]);

// --- Promise.allSettled (never rejects — gives status per item) ---
const results = await Promise.allSettled([
  fetch("/fast"),
  fetch("/might-fail"),
]);
results.forEach(r => {
  if (r.status === "fulfilled") console.log(r.value);
  if (r.status === "rejected") console.log(r.reason);
});

// --- Promise.race (first to settle wins) ---
const winner = await Promise.race([fetch("/a"), fetch("/b")]);

// --- Promise.any (first to SUCCEED wins, ignores rejections) ---
const first = await Promise.any([fetch("/a"), fetch("/b")]);

// --- Sequential async in a loop ---
for (const url of urls) {
  const data = await fetch(url);       // ✅ sequential
}

// --- Parallel async from a loop ---
const promises = urls.map(url => fetch(url));
const responses = await Promise.all(promises);  // ✅ parallel

// --- Typed async with generics ---
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as Promise<T>;
}
const user = await fetchJson<User>("/api/user/1");

// ⚠️ GOTCHA: unhandled rejections crash Node. Always catch at the top.
// ⚠️ GOTCHA: await in forEach doesn't work (see Loops section above)

// --- AbortController (cancel requests) ---
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);      // 5s timeout
const res = await fetch("/slow", { signal: controller.signal });
```

---

### 7. Narrowing & Type Guards

Narrowing is how TypeScript refines a broad type into a specific one inside a control-flow branch. The compiler tracks `typeof` checks, `instanceof`, the `in` operator, and equality comparisons to automatically narrow unions — so after `if (typeof val === "string")`, the compiler knows `val` is `string` in that block. Discriminated unions use a shared literal property (e.g., `status: "ok" | "error"`) as a tag; switching on the tag gives you precise access to each variant's properties. Custom type guards (`val is T`) let you write your own narrowing functions for complex checks. For exhaustiveness, use `assertNever(x: never)` in the default branch — the compiler will error if a union case is unhandled.

```ts
// typeof narrowing
function process(val: string | number) {
  if (typeof val === "string") {
    val.toUpperCase();       // compiler knows it's string here
  }
}

// in narrowing
if ("email" in user) { }    // narrows to type that has email

// instanceof
if (err instanceof TypeError) { }

// Discriminated unions (✅ best practice for complex state)
type Result<T> =
  | { status: "ok"; data: T }
  | { status: "error"; message: string };

function handle(r: Result<User>) {
  if (r.status === "ok") {
    r.data;                  // ✅ compiler knows data exists
  } else {
    r.message;               // ✅ compiler knows message exists
  }
}

// Custom type guard
function isString(val: unknown): val is string {
  return typeof val === "string";
}

// Exhaustiveness check
function assertNever(x: never): never {
  throw new Error(`Unexpected: ${x}`);
}
// Put in the default/else branch — compiler errors if you miss a case
```

---

### 8. Utility Types (Built-in)

TypeScript ships with utility types that transform existing types without rewriting them. `Partial` makes all properties optional (useful for update payloads), `Required` does the reverse, and `Readonly` prevents mutation. `Pick` and `Omit` select or exclude properties by name. `Record<K, V>` creates a dictionary type. `ReturnType` and `Parameters` extract a function's return type and argument tuple. `Awaited` unwraps `Promise<T>` to `T`. `NonNullable` strips `null` and `undefined`. `Extract` and `Exclude` filter union members.

```ts
Partial<User>            // all props optional
Required<User>           // all props required
Readonly<User>           // all props readonly
Pick<User, "id" | "name">  // subset of props
Omit<User, "password">     // all except listed
Record<string, number>     // { [key: string]: number }
ReturnType<typeof fn>      // infer return type of fn
Parameters<typeof fn>      // tuple of param types
Awaited<Promise<string>>   // string — unwraps Promise
NonNullable<string | null> // string — strips null/undefined
Extract<A | B | C, A | B>  // A | B
Exclude<A | B | C, A>      // B | C
```

---

###9. Common Gotchas

These are the traps that consistently surprise developers coming from JavaScript or C#. The type `{}` means "any non-nullish value" (not "empty object") — use `Record<string, unknown>` for objects and `unknown` for truly unknown input. Type assertions (`as T`) compile away entirely, so they hide bugs rather than prevent them — validate at boundaries with tools like zod. TypeScript uses *structural* typing (same shape = same type), not *nominal* typing like C#, so two unrelated interfaces with identical properties are fully interchangeable. `Readonly<T>` is shallow — nested objects remain mutable. Excess property checking only fires on object literals assigned directly; assign through an intermediate variable and extra properties slip through silently.

```ts
// 1. {} and Object accept ANYTHING except null/undefined
let x: {} = "hello";    // ✅ compiles — {} means "any non-nullish value"
// ✅ Use: unknown for "I don't know the type" / Record<string, unknown> for objects

// 2. Type assertions silence the compiler — bugs hide here
const data = fetchThing() as Config;  // no runtime check!
// ✅ Use zod or io-ts for runtime validation of external data

// 3. Structural typing: TS is structural, not nominal (unlike C#)
interface Cat { name: string }
interface Dog { name: string }
const dog: Dog = { name: "Rex" };
const cat: Cat = dog;               // ✅ compiles — same shape

// 4. readonly arrays
function process(items: readonly number[]) {
  items.push(1);  // ❌ compile error
}

// 5. Excess property checking only works on object literals
interface Config { port: number }
const config: Config = { port: 3000, host: "x" };  // ❌ error — good
const obj = { port: 3000, host: "x" };
const config: Config = obj;                          // ✅ compiles — watch out

// 6. strictNullChecks (should ALWAYS be on)
// With it off: string includes null/undefined silently — bugs everywhere
```

---

### 10. Best Practices Cheat Sheet

A quick-reference table of the most impactful habits. The pattern in every row is the same: the "Do" column uses the type system to catch problems at compile time; the "Don't" column defers them to runtime or silences them entirely.

| Practice | Do | Don't |
|---|---|---|
| **Type inference** | `const x = 5` | `const x: number = 5` |
| **Unknown input** | `unknown` then narrow | `any` |
| **Objects** | `Record<string, T>` or interface | `object` or `{}` |
| **Null handling** | Optional chaining `a?.b?.c` | Non-null assertion `a!.b!.c` |
| **Enums** | String enums or `as const` | Numeric enums |
| **Iteration** | `for...of` | `for...in` on arrays |
| **Async loops** | `for...of` + `await` | `forEach` + `async` |
| **Error types** | Discriminated unions | Thrown strings |
| **Config** | `strict: true` in tsconfig | Cherry-picking strict flags |
| **Imports** | `import type { X }` for types | Regular import for type-only use |
| **Runtime validation** | zod / io-ts for API boundaries | Trust `as T` on external data |
| **Readonly** | `as const`, `Readonly<T>` | Mutable by default everywhere |

---

### 11. tsconfig Essentials

The `tsconfig.json` compiler options below are the recommended baseline. `strict: true` is non-negotiable — it enables `strictNullChecks`, `noImplicitAny`, and several other checks in one flag. Beyond strict, `noUncheckedIndexedAccess` makes array/object bracket access return `T | undefined` instead of `T`, catching a whole class of off-by-one and missing-key bugs. `exactOptionalPropertyTypes` distinguishes between "property is missing" and "property is `undefined`." `esModuleInterop` smooths over CommonJS/ESM default import mismatches.

```jsonc
{
  "compilerOptions": {
    "strict": true,              // non-negotiable — turns on all strict checks
    "target": "ES2022",          // modern baseline
    "module": "NodeNext",        // or "ESNext" for bundlers
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,     // fixes CJS/ESM default import issues
    "skipLibCheck": true,        // speeds up compilation
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,  // arr[0] is T | undefined — catches real bugs
    "exactOptionalPropertyTypes": true // undefined ≠ missing — stricter optional props
  }
}
```

---

### 12. Classes (C# Comparison)

Classes in TypeScript use the same `public`, `private`, `protected`, and `readonly` keywords as C#, but the defaults differ — TypeScript defaults to `public` (C# defaults to `internal`). Parameter properties are a major shortcut: adding an access modifier to a constructor parameter both declares and assigns the property in one line. Getters and setters work like C# properties. Abstract classes enforce a contract while providing shared implementation — same concept as C#. The key difference from C#: access modifiers are *compile-time only* — at runtime it's all plain JavaScript with no enforcement, so `private` fields are visible if you inspect the object. For true runtime privacy, use ES2022 `#private` fields. Also watch `this` binding: when a class method is extracted as a callback, `this` becomes `undefined` — use arrow properties to capture `this` from the constructor.
constructor method must be called constructor(), the class name is not allowed. Also, constructor for inherited class must call super(); 

```ts
// Access modifiers — same keywords as C#, different defaults
class User {
  public name: string;              // public is default (C# default is internal)
  private _id: number;              // convention: prefix private with _
  protected role: string;
  readonly createdAt: Date;         // like C# readonly field

  // Parameter properties — shorthand to declare + assign in constructor
  constructor(
    public email: string,           // creates and assigns this.email
    private age: number,            // creates and assigns this.age
  ) {
    this.createdAt = new Date();
  }

  // Getters/setters — identical to C# properties in spirit
  get displayName(): string { return this.name; }
  set displayName(val: string) { this.name = val.trim(); }

  // Static
  static fromJson(json: string): User { return JSON.parse(json); }
}

// Abstract classes — works like C#
abstract class Shape {
  abstract area(): number;
  describe() { return `Area: ${this.area()}`; }  // concrete method OK
}

// implements — like C# interface implementation
interface Serializable { serialize(): string; }
class Config implements Serializable {
  serialize() { return JSON.stringify(this); }
}

// ⚠️ GOTCHA: TS access modifiers are compile-time ONLY — no runtime enforcement
// At runtime it's all plain JS objects. Private fields leak if you inspect.

// ✅ True runtime privacy: use ES2022 #private fields
class Secret {
  #token: string;                   // truly private at runtime
  constructor(token: string) { this.#token = token; }
}

// ⚠️ GOTCHA: `this` binding in classes
class Button {
  label = "click";
  // ❌ `this` is lost when passed as callback
  handleClick() { console.log(this.label); }
  // ✅ Arrow property preserves `this`
  handleClick = () => { console.log(this.label); }
}
```

---

### 13. Decorators

Decorators are functions that modify classes, methods, fields, or accessors at definition time — similar to C# attributes, but they execute code rather than just annotating metadata. There are two incompatible implementations: **Stage 3** (TC39 standard, TS 5.0+, off by default) and **Legacy/Experimental** (`experimentalDecorators: true`, used by Angular and NestJS). Stage 3 decorators receive the target and a typed context object; they return a replacement or wrapper. A decorator factory is a function that returns a decorator, enabling parameterized behavior (e.g., `@minLength(3)`). The `accessor` keyword (new in Stage 3) auto-generates a getter/setter pair from a field declaration. Pick one system per project — they cannot coexist.

```ts
// ══════════════════════════════════════════════════════════════
// TC39 Stage 3 Decorators (TS 5.0+) — THE STANDARD
// tsconfig: "experimentalDecorators": false (or omit — it's off by default)
// ══════════════════════════════════════════════════════════════

// A decorator is a function that receives the target + context
function log(target: Function, context: ClassDecoratorContext) {
  console.log(`Registering class: ${String(context.name)}`);
}

@log
class MyService { }  // logs "Registering class: MyService"

// --- Method decorator ---
function measure(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  return function (this: any, ...args: any[]) {
    const start = performance.now();
    const result = target.apply(this, args);
    console.log(`${String(context.name)}: ${performance.now() - start}ms`);
    return result;
  };
}

class Api {
  @measure
  fetchData() { /* ... */ }
}

// --- Field decorator ---
function minLength(min: number) {
  return function (
    _target: undefined,
    context: ClassFieldDecoratorContext
  ) {
    return function (initialValue: string) {
      if (initialValue.length < min)
        throw new Error(`${String(context.name)} must be ≥ ${min} chars`);
      return initialValue;
    };
  };
}

class Form {
  @minLength(3)
  username = "Jo";  // ❌ throws at instantiation
}

// --- Accessor decorator (auto-accessor keyword — new!) ---
class Settings {
  @validated
  accessor theme: string = "dark";  // creates getter/setter pair automatically
}

// ══════════════════════════════════════════════════════════════
// Legacy/Experimental Decorators (TS < 5.0 / Angular / NestJS)
// tsconfig: "experimentalDecorators": true
// ⚠️ Different API — not compatible with Stage 3
// ══════════════════════════════════════════════════════════════

// Legacy class decorator
function Injectable(): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata("injectable", true, target);
  };
}

// Legacy method decorator (uses PropertyDescriptor — like C# MethodInfo)
function Log(): MethodDecorator {
  return function (target, propertyKey, descriptor: PropertyDescriptor) {
    const orig = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`Calling ${String(propertyKey)}`);
      return orig.apply(this, args);
    };
  };
}

// Legacy parameter decorator (Angular DI uses this heavily)
function Inject(token: string): ParameterDecorator {
  return function (target, propertyKey, paramIndex) {
    // store metadata for DI container
  };
}

// ⚠️ GOTCHA: Stage 3 and Legacy decorators are INCOMPATIBLE
// Pick one per project. Check your framework:
//   Angular → legacy (migrating)    NestJS → legacy
//   New projects → Stage 3

// ✅ Best practice: for new code without a framework, use Stage 3
```

---

### 14. Module Patterns

TypeScript uses ES Modules (ESM) as the standard module system. Named exports (`export function`, `export const`) are preferred over default exports because they enable tree-shaking, IDE auto-import, and consistent naming across consumers. `import type` and `export type` are stripped at compile time, producing zero runtime cost — use them whenever you're importing only types. Barrel files (`index.ts` that re-exports from multiple modules) are convenient for library public APIs but can bloat bundles in application code because bundlers may not tree-shake them effectively. For lazy loading, dynamic `import()` returns a `Promise` and creates a separate chunk at build time. When importing CommonJS modules in ESM, enable `esModuleInterop` in tsconfig to get synthetic default imports. Declaration files (`.d.ts`) let you type third-party JavaScript libraries, augment existing module types (e.g., adding a custom property to Express's `Request`), or extend global types like `Window`. Namespaces are a legacy pattern that don't tree-shake — use ES modules instead.

```ts
// ══════════════════════════════════════
// ESM (EcmaScript Modules) — ✅ default
// ══════════════════════════════════════

// Named exports (preferred — enables tree shaking)
export function validate(input: string): boolean { return input.length > 0; }
export const MAX_RETRIES = 3;
export interface Config { port: number; }

// Named imports
import { validate, MAX_RETRIES, type Config } from "./utils";
//                                ^^^^ type-only import — stripped at compile

// Default export (one per module — use sparingly)
export default class Logger { }
import Logger from "./logger";       // any name works — less discoverable

// Re-exports / Barrel files (index.ts)
export { validate } from "./validate";
export { Logger } from "./logger";
export * from "./types";              // re-export everything
export * as Utils from "./utils";     // namespaced re-export

// ⚠️ GOTCHA: barrel files can bloat bundles — bundlers may not tree-shake them
// ✅ Best practice: use barrels for library public APIs, not internal code

// Type-only imports/exports (zero runtime cost)
import type { User } from "./models";
export type { User };

// Dynamic imports (code splitting / lazy loading)
const module = await import("./heavy-module");   // returns Promise
module.doStuff();

// ══════════════════════════════════════
// CommonJS interop
// ══════════════════════════════════════

// Importing CJS in ESM (with esModuleInterop: true)
import fs from "fs";                  // works — synthetic default
import { readFile } from "fs";       // also works

// ⚠️ GOTCHA: without esModuleInterop, you need:
import * as fs from "fs";            // namespace import for CJS

// ══════════════════════════════════════
// Declaration files (.d.ts)
// ══════════════════════════════════════

// For typing a JS library without TS source
// utils.d.ts
declare module "legacy-lib" {
  export function doThing(input: string): number;
  export interface Options { verbose: boolean; }
}

// For augmenting existing types (module augmentation)
// express.d.ts
declare module "express" {
  interface Request {
    userId?: string;                  // adds custom property to Express Request
  }
}

// Global type declarations
// global.d.ts
declare global {
  interface Window {
    analytics: AnalyticsSDK;          // extend browser globals
  }
}
export {};  // required to make this a module

// ══════════════════════════════════════
// Namespace (avoid for new code — legacy pattern)
// ══════════════════════════════════════
namespace Validation {
  export function isEmail(s: string) { return s.includes("@"); }
}
Validation.isEmail("a@b.com");
// ⚠️ Namespaces don't tree-shake. Use ES modules instead.

// ✅ Module best practices:
//   - named exports > default exports (better IDE autocomplete, refactoring)
//   - import type for type-only usage
//   - isolatedModules: true in tsconfig (required by most bundlers)
//   - .js extension in imports for Node ESM ("./utils.js" even though source is .ts)
```

---

### 15. TypeScript with React

React + TypeScript centers on typing props, hooks, events, and children. Define component props with an `interface` (convention — extendable and mergeable) and destructure them in the function signature. Don't use `React.FC` — it adds implicit `children` typing and opinions have shifted against it; a plain function with typed props is cleaner. For hooks: `useState` infers the type from the initial value, but when initializing with `null` you must provide the type explicitly (`useState<User | null>(null)`). `useRef` for DOM elements takes `null` as the initial value and returns a readonly ref; for mutable refs, use `useRef<T>()` or `useRef<T>(undefined)`. Event handler types are inferred when inline, but extracted handlers need manual typing (e.g., `React.ChangeEvent<HTMLInputElement>`). Generic components use `<T>` on the function to flow types from the `items` prop through to the render callback. Context should be created with `| null` and consumed through a custom hook that throws if the context is missing — this eliminates null checks at every call site.

```tsx
// ══════════════════════════════════════
// Component Props
// ══════════════════════════════════════

// Interface for props (✅ preferred — extendable, good DX)
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary";  // optional with literal union
  disabled?: boolean;
  onClick: () => void;                // callback
  children?: React.ReactNode;         // anything renderable
}

// Functional component
function Button({ label, variant = "primary", onClick, children }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{children ?? label}</button>;
}

// ⚠️ GOTCHA: don't use React.FC — it's baggy and opinions have shifted
// ❌ const Button: React.FC<ButtonProps> = (props) => { }
// ✅ function Button(props: ButtonProps) { }  — cleaner, explicit return type

// Props with HTML element passthrough
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;  // your custom props
}
function Input({ label, ...rest }: InputProps) {
  return <><label>{label}</label><input {...rest} /></>;
}

// ══════════════════════════════════════
// Hooks — Typed
// ══════════════════════════════════════

// useState — inferred when initial value is provided
const [count, setCount] = useState(0);          // inferred as number
const [user, setUser] = useState<User | null>(null);  // explicit for null start

// useRef
const inputRef = useRef<HTMLInputElement>(null);       // DOM ref
const intervalRef = useRef<number | null>(null);       // mutable ref

// ⚠️ GOTCHA: useRef(null) returns RefObject (readonly .current)
//            useRef<T>(undefined) or useRef<T>() returns MutableRefObject

// useReducer
type State = { count: number; error?: string };
type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "error"; message: string };          // discriminated union ✅

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment": return { ...state, count: state.count + 1 };
    case "decrement": return { ...state, count: state.count - 1 };
    case "error":     return { ...state, error: action.message };
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 });

// useCallback / useMemo
const handleClick = useCallback((id: string) => { /* ... */ }, []);
const sorted = useMemo(() => items.sort(), [items]);

// ══════════════════════════════════════
// Events
// ══════════════════════════════════════

// Inline — inferred automatically ✅
<button onClick={(e) => { /* e is React.MouseEvent<HTMLButtonElement> */ }} />
<input onChange={(e) => { /* e is React.ChangeEvent<HTMLInputElement> */ }} />

// Extracted handler — must type manually
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value);
}
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

// Common event types cheat sheet:
// React.MouseEvent<HTMLButtonElement>
// React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
// React.FormEvent<HTMLFormElement>
// React.KeyboardEvent<HTMLInputElement>
// React.FocusEvent<HTMLInputElement>
// React.DragEvent<HTMLDivElement>

// ══════════════════════════════════════
// Generic Components
// ══════════════════════════════════════

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return <ul>{items.map((item, i) => (
    <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
  ))}</ul>;
}

// Usage — T inferred from items
<List
  items={users}
  renderItem={(user) => <span>{user.name}</span>}  // user is User
  keyExtractor={(user) => user.id}
/>

// ══════════════════════════════════════
// Context — Typed
// ══════════════════════════════════════

interface AuthContext {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContext | null>(null);

// Custom hook with null guard (✅ best practice)
function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;  // guaranteed non-null
}

// ══════════════════════════════════════
// Children patterns
// ══════════════════════════════════════

// Most permissive: React.ReactNode (string, number, JSX, null, arrays, fragments)
interface CardProps { children: React.ReactNode; }

// JSX only — no strings/numbers:
interface LayoutProps { children: React.ReactElement; }

// Render prop pattern
interface DataFetcherProps<T> {
  url: string;
  children: (data: T, loading: boolean) => React.ReactNode;
}

// ══════════════════════════════════════
// React + TS best practices
// ══════════════════════════════════════
// ✅ Use interface for props, not type (convention + extendability)
// ✅ Use discriminated unions for component state/variants
// ✅ Extract event handlers when they exceed one line
// ✅ Create custom hooks for reusable logic — always type the return
// ✅ Prefer composition (children/render props) over inheritance
// ✅ Use `as const` for static config objects (routes, options)
// ❌ Avoid enums in React — use literal unions or as const instead
// ❌ Avoid `any` in generic components — use `unknown` + narrowing
```

---

### 16. Advanced Types

These features give TypeScript its real power beyond basic annotations. Conditional types (`T extends U ? X : Y`) work like type-level ternaries and are the foundation of most utility types. The `infer` keyword inside a conditional type lets you extract inner types — e.g., pulling `string` out of `Promise<string>` or extracting a function's first argument type. Mapped types iterate over the keys of a type to transform every property — this is how `Partial`, `Readonly`, and `Pick` work internally; key remapping with `as` lets you rename or filter keys during the mapping. Template literal types bring string manipulation into the type system, generating validated string patterns and combinatorial unions at compile time. The `satisfies` operator (TS 4.9+) validates that a value matches a type *without widening it*, so each property retains its narrow inferred type — use it for config objects, route maps, and theme definitions. Branded types add a phantom property to simulate nominal typing in a structural system, preventing accidental mixing of same-shaped IDs (e.g., `UserId` vs `PostId`). `as const` makes an entire object or array deeply `readonly` with literal types, and `typeof` + `keyof` can derive union types from these const objects — a tree-shakeable, zero-overhead alternative to enums.

```ts
// ══════════════════════════════════════
// Conditional Types (like ternary, but for types)
// ══════════════════════════════════════

type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<string>;   // "yes"
type B = IsString<number>;   // "no"

// Distributive conditional types (applies to each member of a union)
type ToArray<T> = T extends unknown ? T[] : never;
type C = ToArray<string | number>;   // string[] | number[]

// infer keyword — extract inner types
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type D = UnwrapPromise<Promise<string>>;  // string

type FirstArg<T> = T extends (arg: infer A, ...rest: any[]) => any ? A : never;
type E = FirstArg<(name: string, age: number) => void>;  // string

// ══════════════════════════════════════
// Mapped Types (transform every property)
// ══════════════════════════════════════

// Make all props nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Make all props methods
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
//                                   ^^^ key remapping with `as`

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Filter keys by value type
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};

// ══════════════════════════════════════
// Template Literal Types
// ══════════════════════════════════════

type EventName = `on${Capitalize<"click" | "hover" | "focus">}`;
// "onClick" | "onHover" | "onFocus"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = `/api/${"users" | "posts"}`;
type Route = `${HttpMethod} ${Endpoint}`;
// "GET /api/users" | "GET /api/posts" | "POST /api/users" | ... (8 combinations)

// ══════════════════════════════════════
// satisfies Operator (TS 4.9+) — ✅ game changer
// ══════════════════════════════════════

// Problem: `as const` gives narrow types but no validation
// Problem: type annotation widens types but validates

// satisfies: validates against a type WITHOUT widening
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<string, string | number[]>;

palette.green.toUpperCase();   // ✅ compiler knows it's string (not widened to string | number[])
palette.red.map(n => n);       // ✅ compiler knows it's number[]

// Without satisfies — type annotation widens:
const palette2: Record<string, string | number[]> = { red: [255, 0, 0], green: "#00ff00" };
palette2.green.toUpperCase();  // ❌ error — could be number[]

// ✅ Use satisfies for config objects, route maps, theme definitions

// ══════════════════════════════════════
// Branded / Nominal Types (familiar from C#'s strong typing)
// ══════════════════════════════════════

// TS is structural — two identical shapes are interchangeable
// Sometimes you want to prevent mixing (UserId vs PostId)

type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;

function getUser(id: UserId) { /* ... */ }

const userId = "abc" as UserId;
const postId = "xyz" as PostId;

getUser(userId);   // ✅
getUser(postId);   // ❌ compile error — PostId ≠ UserId
getUser("raw");    // ❌ compile error — string ≠ UserId

// ✅ Great for IDs, currency amounts, validated strings

// ══════════════════════════════════════
// const assertions
// ══════════════════════════════════════

// as const makes everything readonly + literal
const routes = {
  home: "/",
  about: "/about",
  user: "/user/:id",
} as const;

type Route = typeof routes[keyof typeof routes];
// "/" | "/about" | "/user/:id"  — literal union, not just string

// Works on arrays too
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = typeof ROLES[number];  // "admin" | "editor" | "viewer"
```

---

### 17. Error Handling Patterns

In TypeScript, `catch` always types the error as `unknown` because JavaScript allows throwing any value — strings, numbers, objects, even `null`. You must narrow before accessing properties, typically with `instanceof Error`. Build custom error hierarchies by extending `Error` (remember to call `Object.setPrototypeOf` in the constructor or `instanceof` checks break in some transpilation targets). For operations that *expectably* fail (parsing, validation, network calls), consider the `Result<T, E>` pattern — a discriminated union of `{ ok: true; data: T }` and `{ ok: false; error: E }` — which makes error handling exhaustive and explicit without try/catch. For typed error domains, use discriminated union error types (e.g., `{ type: "network" } | { type: "auth" }`) with a switch and `assertNever` to guarantee every case is handled at compile time.

```ts
// ══════════════════════════════════════
// The Problem: TS catch is always `unknown`
// ══════════════════════════════════════

try {
  riskyOperation();
} catch (err) {
  // err is `unknown` — must narrow before use
  if (err instanceof Error) {
    console.error(err.message);        // ✅ safe
  } else {
    console.error("Unknown error", err);
  }
}

// ⚠️ GOTCHA: anyone can throw anything in JS
// throw "oops";  throw 42;  throw { code: 500 };
// That's why catch type is `unknown`, not `Error`

// ══════════════════════════════════════
// Custom error classes
// ══════════════════════════════════════

class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

// ══════════════════════════════════════
// Result type pattern (no exceptions — like Rust/C# Railway)
// ══════════════════════════════════════

type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

function parseJson<T>(raw: string): Result<T> {
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

const result = parseJson<Config>(input);
if (result.ok) {
  result.data;     // ✅ type-safe access
} else {
  result.error;    // ✅ error is typed
}

// ✅ Best practice: use Result<T> for operations that "expectably" fail
//    (parsing, validation, network). Use exceptions for "unexpected" failures.

// ══════════════════════════════════════
// Exhaustive error handling
// ══════════════════════════════════════

type ApiError =
  | { type: "network"; retryable: boolean }
  | { type: "auth"; expired: boolean }
  | { type: "validation"; fields: string[] };

function handleError(err: ApiError) {
  switch (err.type) {
    case "network":    return err.retryable ? retry() : fail();
    case "auth":       return err.expired ? refresh() : logout();
    case "validation": return showErrors(err.fields);
    default:           return assertNever(err);  // compiler catches missing cases
  }
}
```

---

### 18. Patterns & Idioms

These are production patterns that leverage TypeScript's type system for safety and expressiveness. The **builder pattern** uses method chaining with `return this` and `keyof T` constraints to create fluent, type-safe APIs — the compiler autocompletes valid field names. **Discriminated union state machines** model multi-state flows (idle → loading → success/error) as a single union type; switching on the discriminant gives precise access to each state's data, and `assertNever` catches missing cases. **Assertion functions** (`asserts val is T`) narrow types by throwing on failure, eliminating repeated null checks after the assertion point. **Const objects as enums** use `as const` with `typeof` + `keyof` to derive a union type from an object — no runtime enum overhead, full tree-shaking, and the object itself is usable as a lookup table.

```ts
// ══════════════════════════════════════
// Builder Pattern (common in C# — works great in TS)
// ══════════════════════════════════════

class QueryBuilder<T> {
  private filters: string[] = [];
  private _limit?: number;

  where(field: keyof T & string, value: unknown): this {
    this.filters.push(`${field} = ${value}`);
    return this;  // returns `this` for chaining
  }

  limit(n: number): this { this._limit = n; return this; }

  build(): string {
    let q = `SELECT * FROM table`;
    if (this.filters.length) q += ` WHERE ${this.filters.join(" AND ")}`;
    if (this._limit) q += ` LIMIT ${this._limit}`;
    return q;
  }
}

new QueryBuilder<User>()
  .where("name", "Jaime")
  .where("age", 42)
  .limit(10)
  .build();

// ══════════════════════════════════════
// Discriminated Union State Machines
// ══════════════════════════════════════

type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function render(state: FetchState<User[]>) {
  switch (state.status) {
    case "idle":    return "Ready";
    case "loading": return "Loading...";
    case "success": return state.data.map(u => u.name).join(", ");
    case "error":   return `Failed: ${state.error.message}`;
  }
}

// ══════════════════════════════════════
// Assertion Functions
// ══════════════════════════════════════

function assertDefined<T>(val: T | null | undefined, msg?: string): asserts val is T {
  if (val == null) throw new Error(msg ?? "Expected value to be defined");
}

const el = document.getElementById("app");  // HTMLElement | null
assertDefined(el, "Missing #app element");
el.innerHTML = "Hello";                     // ✅ compiler knows non-null after assertion

// ══════════════════════════════════════
// Const objects as enums (✅ modern alternative)
// ══════════════════════════════════════

const Status = {
  Active: "active",
  Inactive: "inactive",
  Pending: "pending",
} as const;

type Status = typeof Status[keyof typeof Status];  // "active" | "inactive" | "pending"
// ✅ No runtime enum overhead, full type safety, tree-shakeable
```

---

## 19. Best Practices — Expanded

Beyond `strict: true`, enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, and `isolatedModules` (required by most bundlers). Organize code so the `types/` directory contains zero runtime code — only types and interfaces. Use `import type` for type-only imports to guarantee zero runtime cost. At API boundaries (external data, user input, config files), never trust `as T` — validate with a library like zod and derive your TypeScript type from the schema (`z.infer<typeof Schema>`) so the runtime check and the type stay in sync as a single source of truth. Default to immutability: `as const` for config, `Readonly<T>` for function parameters, `readonly` arrays for anything that shouldn't be mutated.

```ts
// ══════════════════════════════════════
// Strict tsconfig (expanded from Section 11)
// ══════════════════════════════════════

// ✅ Always enable these beyond `strict: true`:
// "noUncheckedIndexedAccess": true   — arr[0] is T | undefined
// "exactOptionalPropertyTypes": true — { x?: string } means string only, not undefined
// "noFallthroughCasesInSwitch": true — catch missing breaks
// "isolatedModules": true            — required by most bundlers (Vite, esbuild)
// "verbatimModuleSyntax": true       — enforces `import type` (TS 5.0+)

// ══════════════════════════════════════
// Project organization
// ══════════════════════════════════════

// src/
// ├── types/           ← shared type definitions
// │   ├── api.ts       ← API response/request shapes
// │   ├── domain.ts    ← business domain types
// │   └── index.ts     ← barrel export
// ├── utils/           ← pure functions, helpers
// ├── hooks/           ← React hooks (if applicable)
// ├── services/        ← API clients, external integrations
// └── components/      ← UI components

// ✅ Rule: types/ should have ZERO runtime code — only types and interfaces

// ══════════════════════════════════════
// Import hygiene
// ══════════════════════════════════════

import type { User } from "./types";          // ✅ type-only — zero runtime cost
import { validateUser } from "./utils";       // runtime import
import { type Config, createConfig } from "./config";  // ✅ mixed inline

// ══════════════════════════════════════
// Defensive coding
// ══════════════════════════════════════

// ✅ Prefer unknown over any — forces narrowing
function handle(input: unknown) {
  if (typeof input === "string") { /* safe */ }
}

// ✅ Validate at boundaries — trust internally
import { z } from "zod";
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;       // derive type from schema — single source of truth

const parsed = UserSchema.safeParse(apiResponse);
if (parsed.success) { /* parsed.data is User */ }

// ✅ Prefer immutability
const config = { port: 3000, host: "localhost" } as const;
function process(items: readonly string[]) { }

// ✅ Use `satisfies` for config validation without widening (see Section 16)
// ✅ Use branded types for IDs to prevent mixing (see Section 16)
// ✅ Use discriminated unions for state management (see Section 18)
// ✅ Use Result<T> for expected failures, exceptions for unexpected (see Section 17)
```

---

*Last updated: March 2026*


## Feedback, Errata, Contributions 
Suggestions and PRs are welcome. You know what to do. 


 
