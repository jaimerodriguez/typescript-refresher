// ============================================================
// 06 — ADVANCED TYPES
// Run: npx tsx src/06-advanced-types.ts
// Most of these are compile-time concepts — console.log shows runtime results
// while the real magic is in the TYPE ANNOTATIONS (hover in IDE)
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. Conditional Types");
// ────────────────────────────────────────────────────────────

// Like a ternary, but for types
type IsString<T> = T extends string ? "yes" : "no";

// These are compile-time only — but we can demonstrate the concept at runtime
type Test1 = IsString<string>;    // "yes"
type Test2 = IsString<number>;    // "no"

// Practical: flatten Promise types
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>;        // string
type B = UnwrapPromise<Promise<Promise<number>>>;  // Promise<number> — only one level!
type C = UnwrapPromise<string>;                 // string — passes through

// Deep unwrap
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;
type D = DeepUnwrap<Promise<Promise<Promise<boolean>>>>;  // boolean

console.log("Conditional types are compile-time — hover in IDE to see results");
console.log("UnwrapPromise<Promise<string>> = string");
console.log("DeepUnwrap<Promise<Promise<Promise<boolean>>>> = boolean");

// ────────────────────────────────────────────────────────────
section("2. infer Keyword — Extract Inner Types");
// ────────────────────────────────────────────────────────────

// Extract return type of a function
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser(name: string, age: number) {
  return { id: Math.random().toString(36), name, age };
}

type CreatedUser = MyReturnType<typeof createUser>;
// { id: string; name: string; age: number }

// Extract first argument
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;
type NameArg = FirstArg<typeof createUser>;  // string

// Extract array element type
type ElementOf<T> = T extends (infer E)[] ? E : never;
type Item = ElementOf<string[]>;  // string

const user: CreatedUser = createUser("Jaime", 42);
console.log("Created user (type extracted via infer):", user);

// ────────────────────────────────────────────────────────────
section("3. Discriminated Unions — State Machine");
// ────────────────────────────────────────────────────────────

// Real-world: data fetching states
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "success"; data: T; fetchedAt: number }
  | { status: "error"; error: Error; retryCount: number };

interface Product {
  id: string;
  name: string;
  price: number;
}

function renderProducts(state: FetchState<Product[]>): string {
  // 🔍 DEBUGGER: step through each case — watch the type narrow
  switch (state.status) {
    case "idle":
      return "Click to load products";
    case "loading":
      return `Loading... (started ${Date.now() - state.startedAt}ms ago)`;
    case "success":
      return state.data.map(p => `${p.name}: $${p.price}`).join(", ");
    case "error":
      return `Error: ${state.error.message} (retry #${state.retryCount})`;
  }
}

// Simulate state transitions
const states: FetchState<Product[]>[] = [
  { status: "idle" },
  { status: "loading", startedAt: Date.now() - 500 },
  { status: "success", data: [
    { id: "1", name: "Widget", price: 9.99 },
    { id: "2", name: "Gadget", price: 24.99 },
  ], fetchedAt: Date.now() },
  { status: "error", error: new Error("Network timeout"), retryCount: 2 },
];

states.forEach(state => {
  console.log(`  [${state.status}] → ${renderProducts(state)}`);
});

// ────────────────────────────────────────────────────────────
section("4. Exhaustiveness Checking");
// ────────────────────────────────────────────────────────────

type PaymentMethod = "credit" | "debit" | "crypto" | "wire";

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function processPayment(method: PaymentMethod): string {
  switch (method) {
    case "credit": return "Processing credit card";
    case "debit":  return "Processing debit card";
    case "crypto": return "Processing crypto wallet";
    case "wire":   return "Processing wire transfer";
    default:       return assertNever(method);
    // If you add a new PaymentMethod but forget a case,
    // `method` won't be `never` and this line will ERROR at compile time
  }
}

(["credit", "debit", "crypto", "wire"] as PaymentMethod[]).forEach(m => {
  console.log(`  ${m} → ${processPayment(m)}`);
});

// 🧪 EXERCISE: add "paypal" to PaymentMethod union and watch the compiler
//              complain about the missing case — without even running it!

// ────────────────────────────────────────────────────────────
section("5. Template Literal Types");
// ────────────────────────────────────────────────────────────

// Build type-safe event names
type EventName = `on${Capitalize<"click" | "hover" | "focus" | "blur">}`;
// "onClick" | "onHover" | "onFocus" | "onBlur"

// Type-safe CSS properties
type CssUnit = "px" | "rem" | "em" | "%";
type CssValue = `${number}${CssUnit}`;

const width: CssValue = "100px";      // ✅
const height: CssValue = "3.5rem";    // ✅
// const bad: CssValue = "100";        // ❌ missing unit
// const worse: CssValue = "big px";   // ❌ not a number

// Type-safe route params
type Route = `/api/${"users" | "posts"}/${string}`;
const userRoute: Route = "/api/users/123";       // ✅
const postRoute: Route = "/api/posts/abc-456";   // ✅
// const bad: Route = "/api/comments/1";          // ❌

console.log("Template literals — compile-time string validation:");
console.log("  CssValue:", width, height);
console.log("  Route:", userRoute, postRoute);

// Combo explosion
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = "/users" | "/posts" | "/comments";
type ApiRoute = `${HttpMethod} ${Endpoint}`;
// 4 × 3 = 12 valid combinations, all type-checked

console.log("  ApiRoute has", 4 * 3, "valid combinations — all checked at compile time");

// ────────────────────────────────────────────────────────────
section("6. Branded / Nominal Types");
// ────────────────────────────────────────────────────────────

// TS is structural — UserId and PostId would normally be interchangeable
// Branding adds a phantom property that prevents mixing

type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;
type OrderId = Brand<string, "OrderId">;

// Factory functions that "stamp" the brand
function asUserId(id: string): UserId { return id as UserId; }
function asPostId(id: string): PostId { return id as PostId; }
function asOrderId(id: string): OrderId { return id as OrderId; }

function getUser(id: UserId) { return { id, name: "User" }; }
function getPost(id: PostId) { return { id, title: "Post" }; }

const userId = asUserId("user-123");
const postId = asPostId("post-456");

getUser(userId);     // ✅
getPost(postId);     // ✅
// getUser(postId);  // ❌ compile error: PostId is not UserId!
// getPost(userId);  // ❌ compile error: UserId is not PostId!

console.log("Branded types prevent ID mixing:");
console.log("  getUser(userId) ✅ — compiles");
console.log("  getUser(postId) ❌ — PostId ≠ UserId");
console.log("  At runtime, both are just strings:", typeof userId, typeof postId);

// ────────────────────────────────────────────────────────────
section("7. Mapped Types — Transform Shapes");
// ────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  email: string;
  age: number;
  bio: string;
}

// Make all props optional (reimplementing Partial)
type MyPartial<T> = { [K in keyof T]?: T[K] };

// Make all string props uppercase functions
type Validators<T> = {
  [K in keyof T as `validate${Capitalize<string & K>}`]: (value: T[K]) => boolean
};

type UserValidators = Validators<UserProfile>;
// {
//   validateName: (value: string) => boolean;
//   validateEmail: (value: string) => boolean;
//   validateAge: (value: number) => boolean;
//   validateBio: (value: string) => boolean;
// }

const validators: UserValidators = {
  validateName: (v) => v.length >= 2,
  validateEmail: (v) => v.includes("@"),
  validateAge: (v) => v >= 0 && v <= 150,
  validateBio: (v) => v.length <= 500,
};

console.log("Mapped validators:");
console.log("  validateName('J'):", validators.validateName("J"));
console.log("  validateName('Jaime'):", validators.validateName("Jaime"));
console.log("  validateEmail('bad'):", validators.validateEmail("bad"));
console.log("  validateEmail('j@ms.com'):", validators.validateEmail("j@ms.com"));

// Filter: only keep string properties
type StringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};

type UserStrings = StringProps<UserProfile>;
// { name: string; email: string; bio: string }  — age removed!
console.log("\nStringProps<UserProfile> removes non-string props (age)");

// ────────────────────────────────────────────────────────────
section("8. Custom Type Guard");
// ────────────────────────────────────────────────────────────

interface AdminUser { role: "admin"; permissions: string[] }
interface RegularUser { role: "user"; subscription: string }
type AppUser = AdminUser | RegularUser;

// Custom type guard — narrows within if blocks
function isAdmin(user: AppUser): user is AdminUser {
  return user.role === "admin";
}

function handleUser(user: AppUser) {
  if (isAdmin(user)) {
    console.log("  Admin permissions:", user.permissions);  // ✅ compiler knows
  } else {
    console.log("  User subscription:", user.subscription); // ✅ compiler knows
  }
}

handleUser({ role: "admin", permissions: ["read", "write", "delete"] });
handleUser({ role: "user", subscription: "pro" });

// Assertion function — throws instead of returning boolean
function assertAdmin(user: AppUser): asserts user is AdminUser {
  if (user.role !== "admin") throw new Error("Not an admin");
}

const someUser: AppUser = { role: "admin", permissions: ["all"] };
assertAdmin(someUser);
console.log("\nAfter assertion, compiler knows permissions:", someUser.permissions);

// ────────────────────────────────────────────────────────────
section("9. const Objects as Enums (Modern Pattern)");
// ────────────────────────────────────────────────────────────

// ✅ Modern alternative to TS enums
const HttpStatus = {
  OK: 200,
  Created: 201,
  BadRequest: 400,
  Unauthorized: 401,
  NotFound: 404,
  ServerError: 500,
} as const;

// Derive the union type from the object
type HttpStatus = typeof HttpStatus[keyof typeof HttpStatus];
// 200 | 201 | 400 | 401 | 404 | 500

function describeStatus(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.OK: return "Success";
    case HttpStatus.Created: return "Created";
    case HttpStatus.BadRequest: return "Bad Request";
    case HttpStatus.Unauthorized: return "Unauthorized";
    case HttpStatus.NotFound: return "Not Found";
    case HttpStatus.ServerError: return "Server Error";
  }
}

// ✅ Type-safe, tree-shakeable, no runtime enum overhead
console.log("const enum pattern:");
Object.entries(HttpStatus).forEach(([name, code]) => {
  console.log(`  ${name} (${code}): ${describeStatus(code as HttpStatus)}`);
});

// Roles example — derives union from array
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = typeof ROLES[number];  // "admin" | "editor" | "viewer"

function hasRole(userRoles: Role[], required: Role): boolean {
  return userRoles.includes(required);
}

console.log("\nDerived Role union from array:");
console.log("  hasRole(['admin', 'editor'], 'editor'):", hasRole(["admin", "editor"], "editor"));

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Add a new PaymentMethod in section 4 to see exhaustiveness.\n${"═".repeat(60)}`);
