// ============================================================
// 07 — ERROR HANDLING PATTERNS
// Run: npx tsx src/07-error-handling.ts
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. catch is Always `unknown`");
// ────────────────────────────────────────────────────────────

// ⚠️ GOTCHA: anyone can throw ANYTHING in JS
function mightThrowAnything(n: number) {
  switch (n) {
    case 1: throw new Error("Standard error");
    case 2: throw "just a string";
    case 3: throw 42;
    case 4: throw { code: "CUSTOM", detail: "object thrown" };
    case 5: throw null;
  }
}

for (let i = 1; i <= 5; i++) {
  try {
    mightThrowAnything(i);
  } catch (err) {
    // err is `unknown` — you MUST narrow before using it
    if (err instanceof Error) {
      console.log(`  [${i}] Error instance: "${err.message}"`);
    } else if (typeof err === "string") {
      console.log(`  [${i}] String thrown: "${err}"`);
    } else if (typeof err === "number") {
      console.log(`  [${i}] Number thrown: ${err}`);
    } else if (err === null) {
      console.log(`  [${i}] Null thrown!`);
    } else {
      console.log(`  [${i}] Unknown shape:`, err);
    }
  }
}

// ────────────────────────────────────────────────────────────
section("2. Custom Error Hierarchy");
// ────────────────────────────────────────────────────────────

class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    // ⚠️ GOTCHA: must fix prototype chain for instanceof to work
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} "${id}" not found`, "NOT_FOUND", 404, { resource, id });
    this.name = "NotFoundError";
  }
}

class ValidationError extends AppError {
  constructor(public fields: Record<string, string>) {
    super("Validation failed", "VALIDATION_ERROR", 400, { fields });
    this.name = "ValidationError";
  }
}

class AuthError extends AppError {
  constructor(
    message: string,
    public expired: boolean = false,
  ) {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

// Error handler using instanceof chain
function handleError(err: unknown): string {
  if (err instanceof ValidationError) {
    const fieldErrors = Object.entries(err.fields)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
    return `⚠️ Validation: ${fieldErrors}`;
  }
  if (err instanceof NotFoundError) {
    return `🔍 Not found: ${err.message}`;
  }
  if (err instanceof AuthError) {
    return err.expired ? "🔒 Session expired, please re-login" : `🔒 ${err.message}`;
  }
  if (err instanceof AppError) {
    return `❌ App error [${err.code}]: ${err.message}`;
  }
  if (err instanceof Error) {
    return `💥 Unexpected: ${err.message}`;
  }
  return `💥 Unknown error: ${String(err)}`;
}

const testErrors = [
  new ValidationError({ email: "invalid format", name: "too short" }),
  new NotFoundError("User", "user-999"),
  new AuthError("Token expired", true),
  new AuthError("Invalid credentials"),
  new AppError("Database connection failed", "DB_ERROR", 503),
  new Error("Something unexpected"),
  "a raw string",
];

testErrors.forEach(err => {
  console.log(`  ${handleError(err)}`);
});

// ────────────────────────────────────────────────────────────
section("3. Result<T, E> Pattern — No Exceptions");
// ────────────────────────────────────────────────────────────

// Like Rust's Result or C#'s railway pattern
type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// Helper factories
function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}
function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Use Result instead of try/catch
function parseJson<T>(raw: string): Result<T, string> {
  try {
    return ok(JSON.parse(raw));
  } catch {
    return err(`Invalid JSON: "${raw.slice(0, 30)}..."`);
  }
}

function validateAge(age: unknown): Result<number, string> {
  if (typeof age !== "number") return err(`Expected number, got ${typeof age}`);
  if (age < 0 || age > 150) return err(`Age ${age} out of range [0-150]`);
  if (!Number.isInteger(age)) return err(`Age must be integer, got ${age}`);
  return ok(age);
}

// Consuming Results — exhaustive, no try/catch needed
console.log("JSON parsing:");
const goodJson = parseJson<{ name: string }>('{"name": "Jaime"}');
const badJson = parseJson<{ name: string }>("not json");

if (goodJson.ok) console.log("  ✅", goodJson.data.name);
else console.log("  ❌", goodJson.error);

if (badJson.ok) console.log("  ✅", badJson.data.name);
else console.log("  ❌", badJson.error);

console.log("\nAge validation:");
[25, -5, 200, 3.5, "old"].forEach(input => {
  const result = validateAge(input);
  if (result.ok) console.log(`  ✅ ${input} → valid age: ${result.data}`);
  else console.log(`  ❌ ${input} → ${result.error}`);
});

// ────────────────────────────────────────────────────────────
section("4. Chaining Results (Pipeline)");
// ────────────────────────────────────────────────────────────

// Map over Result — only transforms success
function mapResult<T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.data)) : result;
}

// FlatMap — chain Results that can fail
function flatMap<T, U, E>(result: Result<T, E>, fn: (val: T) => Result<U, E>): Result<U, E> {
  return result.ok ? fn(result.data) : result;
}

// Pipeline example: parse → validate → transform
interface UserInput { name: string; age: number }

function processUserInput(raw: string): Result<string, string> {
  const parsed = parseJson<UserInput>(raw);
  const validated = flatMap(parsed, user => {
    const ageResult = validateAge(user.age);
    return mapResult(ageResult, age => ({ ...user, age }));
  });
  return mapResult(validated, user => `${user.name} (age ${user.age})`);
}

console.log("Pipeline results:");
const inputs = [
  '{"name": "Jaime", "age": 42}',
  '{"name": "Bob", "age": -5}',
  'not json at all',
  '{"name": "Alice", "age": 25.5}',
];

inputs.forEach(input => {
  const result = processUserInput(input);
  const icon = result.ok ? "✅" : "❌";
  const value = result.ok ? result.data : result.error;
  console.log(`  ${icon} ${input.slice(0, 35)} → ${value}`);
});

// ────────────────────────────────────────────────────────────
section("5. Discriminated Union Errors (Typed Error Handling)");
// ────────────────────────────────────────────────────────────

// Instead of Error subclasses, use discriminated unions
type ApiError =
  | { type: "network"; message: string; retryable: boolean }
  | { type: "auth"; message: string; expired: boolean }
  | { type: "validation"; fields: Record<string, string> }
  | { type: "not_found"; resource: string; id: string }
  | { type: "rate_limit"; retryAfter: number };

type ApiResult<T> = Result<T, ApiError>;

async function simulateApi(scenario: string): Promise<ApiResult<string>> {
  switch (scenario) {
    case "success": return ok("Data loaded!");
    case "network": return err({ type: "network", message: "Connection refused", retryable: true });
    case "auth":    return err({ type: "auth", message: "Token invalid", expired: true });
    case "valid":   return err({ type: "validation", fields: { email: "required" } });
    case "404":     return err({ type: "not_found", resource: "User", id: "999" });
    case "rate":    return err({ type: "rate_limit", retryAfter: 30 });
    default:        return err({ type: "network", message: "Unknown", retryable: false });
  }
}

// Exhaustive error handler — compiler ensures all cases covered
function handleApiError(error: ApiError): string {
  switch (error.type) {
    case "network":
      return error.retryable ? "🔄 Retrying..." : "🛑 Network error (no retry)";
    case "auth":
      return error.expired ? "🔒 Session expired → redirect to login" : "🔒 Bad credentials";
    case "validation":
      return `📝 Fix: ${Object.entries(error.fields).map(([k,v]) => `${k} ${v}`).join(", ")}`;
    case "not_found":
      return `🔍 ${error.resource} ${error.id} does not exist`;
    case "rate_limit":
      return `⏳ Rate limited — retry in ${error.retryAfter}s`;
  }
}

const scenarios = ["success", "network", "auth", "valid", "404", "rate"];
for (const scenario of scenarios) {
  const result = await simulateApi(scenario);
  if (result.ok) {
    console.log(`  ✅ ${scenario}: ${result.data}`);
  } else {
    console.log(`  ${handleApiError(result.error)}`);
  }
}

// ────────────────────────────────────────────────────────────
section("6. ⚠️ Error Handling Gotchas");
// ────────────────────────────────────────────────────────────

// GOTCHA 1: Error.cause (ES2022) — chain errors without losing context
function fetchData() {
  try {
    throw new Error("DB connection failed");
  } catch (err) {
    throw new Error("fetchData failed", { cause: err });  // preserves original
  }
}

try {
  fetchData();
} catch (err) {
  if (err instanceof Error) {
    console.log("Error:", err.message);
    console.log("Cause:", (err.cause as Error)?.message);
  }
}

// GOTCHA 2: Promise rejections are NOT caught by try/catch without await
console.log("\n⚠️ Floating promise rejection (no await):");
async function dangerousFireAndForget() {
  // This rejection is UNHANDLED — no try/catch wraps the await
  // In production: crashes Node, silent in browsers
  // Promise.reject(new Error("unhandled!"));
  console.log("  (Would crash Node if uncommented — unhandled rejection)");
}
await dangerousFireAndForget();

// ✅ Always handle: await + try/catch, or .catch()

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Try the Result pattern in your own code.\n${"═".repeat(60)}`);
