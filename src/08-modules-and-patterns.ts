// ============================================================
// 08 — MODULES & REAL-WORLD PATTERNS
// Run: npx tsx src/08-modules-and-patterns.ts
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }



// ────────────────────────────────────────────────────────────
section("1. Module Exports & Imports (ESM)");
// ────────────────────────────────────────────────────────────

// In a real project, these would be in separate files.
// Demonstrating the patterns inline with commentary.

// Named exports (✅ preferred — tree-shakeable, discoverable)
// export function validate(input: string): boolean { ... }
// export const MAX = 100;
// export interface Config { port: number }

// Default export (one per module — less discoverable)
// export default class Logger { ... }

// Type-only export (stripped at compile time — zero cost)
// export type { User } from "./models";
// import type { User } from "./models";

// Re-exports / Barrel files (index.ts)
// export { validate } from "./validate";
// export * from "./types";
// export * as Utils from "./utils";

console.log("Module patterns are structural — see inline comments for usage");
console.log("Key rule: named exports > default exports");

// ────────────────────────────────────────────────────────────
section("2. Dynamic Imports (Code Splitting)");
// ────────────────────────────────────────────────────────────

// Dynamic import returns a Promise — great for lazy loading
async function loadHeavyModule() {
  // In real code: const { parse } = await import("./heavy-parser");
  // The bundler splits this into a separate chunk

  // Simulating:
  const module = await Promise.resolve({
    parse: (input: string) => input.toUpperCase(),
    version: "2.0.0",
  });

  console.log("  Dynamically loaded module version:", module.version);
  console.log("  module.parse('hello'):", module.parse("hello"));
}
await loadHeavyModule();

// Pattern: conditional imports
const isNode = typeof process !== "undefined";
console.log("  Environment:", isNode ? "Node.js" : "Browser");
// if (isNode) { const fs = await import("fs"); }

// ────────────────────────────────────────────────────────────
section("3. Declaration Files (.d.ts) — Typing External Code");
// ────────────────────────────────────────────────────────────

// When you have a JS library without types:
//
// --- legacy-lib.d.ts ---
// declare module "legacy-lib" {
//   export function doThing(input: string): number;
//   export interface Options { verbose: boolean }
// }

// Module augmentation — add props to existing types:
//
// --- express-augment.d.ts ---
// declare module "express" {
//   interface Request {
//     userId?: string;     // ← your custom property
//   }
// }

// Global augmentation:
//
// --- global.d.ts ---
// declare global {
//   interface Window {
//     analytics: { track: (event: string) => void };
//   }
// }
// export {};  // ← required to make it a module!

console.log("Declaration files (.d.ts):");
console.log("  - Type JS libraries: declare module 'lib-name' { ... }");
console.log("  - Augment existing types: declare module 'express' { ... }");
console.log("  - Global types: declare global { ... }");

// ────────────────────────────────────────────────────────────
section("4. Generic Repository Pattern");
// ────────────────────────────────────────────────────────────

// A pattern common in C# — maps cleanly to TS

interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findMany(filter: Partial<T>): Promise<T[]>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// In-memory implementation
class InMemoryRepo<T extends Entity> implements Repository<T> {
  private store = new Map<string, T>();
  private counter = 0;

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async findMany(filter: Partial<T>): Promise<T[]> {
    return [...this.store.values()].filter(item =>
      Object.entries(filter).every(([k, v]) => (item as any)[k] === v)
    );
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const now = new Date();
    const entity = {
      ...data,
      id: `${++this.counter}`,
      createdAt: now,
      updatedAt: now,
    } as T;
    this.store.set(entity.id, entity);
    return entity;
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Entity ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

// Typed usage
interface User extends Entity {
  name: string;
  email: string;
  role: "admin" | "user";
}

const userRepo: Repository<User> = new InMemoryRepo<User>();

const created = await userRepo.create({ name: "Jaime", email: "j@ms.com", role: "admin" });
console.log("Created:", created);

await userRepo.create({ name: "Alice", email: "a@ms.com", role: "user" });
const admins = await userRepo.findMany({ role: "admin" } as Partial<User>);
console.log("Admins:", admins.map(u => u.name));

const updated = await userRepo.update(created.id, { name: "Jaime M." });
console.log("Updated:", updated.name, "at", updated.updatedAt.toISOString());

// ────────────────────────────────────────────────────────────
section("5. Event Emitter (Typed)");
// ────────────────────────────────────────────────────────────

// Type-safe events — no more magic strings
type EventMap = {
  "user:login": { userId: string; timestamp: Date };
  "user:logout": { userId: string };
  "order:created": { orderId: string; total: number };
  "error": { message: string; code: number };
};

class TypedEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof Events & string>(
    event: K,
    handler: (payload: Events[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    // Return unsubscribe function
    return () => { this.listeners.get(event)?.delete(handler); };
  }

  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(payload));
  }
}

const bus = new TypedEmitter<EventMap>();

// ✅ Fully typed — handler payload is inferred from the event name
const unsub = bus.on("user:login", (data) => {
  console.log(`  Login: ${data.userId} at ${data.timestamp.toISOString()}`);
});

bus.on("order:created", (data) => {
  console.log(`  Order: ${data.orderId} for $${data.total}`);
});

// bus.on("user:login", (data) => data.orderId);  ← ERROR: orderId not on login event

bus.emit("user:login", { userId: "user-1", timestamp: new Date() });
bus.emit("order:created", { orderId: "ord-123", total: 49.99 });

unsub();  // unsubscribe
bus.emit("user:login", { userId: "user-2", timestamp: new Date() });
console.log("  (second login not logged — unsubscribed)");

// ────────────────────────────────────────────────────────────
section("6. Middleware Pattern (Express/Koa Style)");
// ────────────────────────────────────────────────────────────

interface Context {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  response?: { status: number; body: unknown };
  metadata: Record<string, unknown>;
}

type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;

class Pipeline {
  private middlewares: Middleware[] = [];

  use(mw: Middleware): this {
    this.middlewares.push(mw);
    return this;
  }

  async execute(ctx: Context): Promise<Context> {
    let index = 0;
    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const mw = this.middlewares[index++]!;
        await mw(ctx, next);
      }
    };
    await next();
    return ctx;
  }
}

// Build a pipeline
const api = new Pipeline()
  .use(async (ctx, next) => {
    const start = Date.now();
    console.log(`  → ${ctx.method} ${ctx.path}`);
    await next();
    console.log(`  ← ${ctx.response?.status} (${Date.now() - start}ms)`);
  })
  .use(async (ctx, next) => {
    // Auth check
    if (!ctx.headers["authorization"]) {
      ctx.response = { status: 401, body: "Unauthorized" };
      return;  // short-circuit — don't call next()
    }
    ctx.metadata["userId"] = "user-1";
    await next();
  })
  .use(async (ctx, next) => {
    // Route handler
    if (ctx.path === "/users" && ctx.method === "GET") {
      await new Promise(r => setTimeout(r, 50));  // simulate DB
      ctx.response = { status: 200, body: [{ name: "Jaime" }] };
    }
    await next();
  });

// Authenticated request
const ctx1 = await api.execute({
  path: "/users", method: "GET",
  headers: { authorization: "Bearer token" },
  metadata: {},
});
console.log("  Response:", ctx1.response);

// Unauthenticated request
console.log();
const ctx2 = await api.execute({
  path: "/users", method: "GET",
  headers: {},
  metadata: {},
});
console.log("  Response:", ctx2.response);

// ────────────────────────────────────────────────────────────
section("7. Type-Safe Configuration");
// ────────────────────────────────────────────────────────────

// Real-world: app config with environment-based overrides

const environments = ["development", "staging", "production"] as const;
type Environment = typeof environments[number];

interface AppConfig {
  env: Environment;
  port: number;
  database: { host: string; port: number; name: string };
  features: { darkMode: boolean; betaAccess: boolean };
  logLevel: "debug" | "info" | "warn" | "error";
}

// satisfies validates shape WITHOUT widening — each value keeps its literal type
const defaults = {
  env: "development",
  port: 3000,
  database: { host: "localhost", port: 5432, name: "app_dev" },
  features: { darkMode: true, betaAccess: true },
  logLevel: "debug",
} satisfies AppConfig;

const production = {
  ...defaults,
  env: "production",
  port: 8080,
  database: { host: "db.prod.internal", port: 5432, name: "app_prod" },
  features: { darkMode: true, betaAccess: false },
  logLevel: "warn",
} satisfies AppConfig;

// Deep merge utility (typed)
function mergeConfig<T extends Record<string, unknown>>(base: T, overrides: Partial<T>): T {
  const result = { ...base };
  for (const key in overrides) {
    const val = overrides[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      (result as any)[key] = mergeConfig(
        (base as any)[key] ?? {},
        val as Record<string, unknown>
      );
    } else if (val !== undefined) {
      (result as any)[key] = val;
    }
  }
  return result;
}

const custom = mergeConfig(defaults, { port: 4000, features: { darkMode: false } as any });
console.log("Default config:", defaults.env, `port:${defaults.port}`);
console.log("Production config:", production.env, `port:${production.port}`);
console.log("Custom merge:", `port:${custom.port}`, "darkMode:", custom.features.darkMode);

// ────────────────────────────────────────────────────────────
section("8. Composable Validators (Functional)");
// ────────────────────────────────────────────────────────────

// Build complex validation from simple pieces

type Validator<T> = (value: T) => string | null;  // null = valid

// Primitive validators
const required: Validator<string> = (v) => v.length === 0 ? "Required" : null;
const minLen = (n: number): Validator<string> => (v) => v.length < n ? `Min ${n} chars` : null;
const maxLen = (n: number): Validator<string> => (v) => v.length > n ? `Max ${n} chars` : null;
const matches = (re: RegExp, msg: string): Validator<string> => (v) => re.test(v) ? null : msg;
const email = matches(/^[^@]+@[^@]+\.[^@]+$/, "Invalid email");

// Combinator: run all validators, collect errors
function all<T>(...validators: Validator<T>[]): Validator<T> {
  return (value) => {
    const errors = validators.map(v => v(value)).filter(Boolean);
    return errors.length ? errors.join("; ") : null;
  };
}

// Build field validators
const validateName = all(required, minLen(2), maxLen(50));
const validateEmail = all(required, email);
const validatePassword = all(
  required,
  minLen(8),
  matches(/[A-Z]/, "Need uppercase"),
  matches(/[0-9]/, "Need digit"),
);

// Schema validator
interface SignupForm {
  name: string;
  email: string;
  password: string;
}

function validateForm(form: SignupForm): Record<string, string> | null {
  const errors: Record<string, string> = {};
  const nameErr = validateName(form.name);
  const emailErr = validateEmail(form.email);
  const passErr = validatePassword(form.password);

  if (nameErr) errors["name"] = nameErr;
  if (emailErr) errors["email"] = emailErr;
  if (passErr) errors["password"] = passErr;

  return Object.keys(errors).length ? errors : null;
}

const testForms: SignupForm[] = [
  { name: "Jaime", email: "j@ms.com", password: "Str0ngPass" },   // valid
  { name: "", email: "bad", password: "weak" },                     // all bad
  { name: "J", email: "j@ms.com", password: "nouppercase1" },      // partial
];

testForms.forEach(form => {
  const errors = validateForm(form);
  if (errors) {
    console.log(`  ❌ ${JSON.stringify(form)}`);
    Object.entries(errors).forEach(([field, msg]) => {
      console.log(`     ${field}: ${msg}`);
    });
  } else {
    console.log(`  ✅ ${JSON.stringify(form)}`);
  }
});

console.log(`\n${"═".repeat(60)}\n  ✅ Done! These patterns are production-ready — take them.\n${"═".repeat(60)}`);
