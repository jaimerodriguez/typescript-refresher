// ============================================================
// 02 — FUNCTIONS & GENERICS
// Run: npx tsx src/02-functions-and-generics.ts
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. Basic Function Signatures");
// ────────────────────────────────────────────────────────────

// Explicit return type
function add(a: number, b: number): number { return a + b; }

// Arrow with inference
const multiply = (a: number, b: number) => a * b;

// Optional, default, rest
function greet(name: string, greeting = "Hello", ...tags: string[]): string {
  return `${greeting}, ${name}${tags.length ? ` [${tags.join(", ")}]` : ""}`;
}


console.log(greet("Tom"));                          // default greeting
console.log(greet("Tom", "Hey", "vip", "admin"));   // custom + rest params

// ────────────────────────────────────────────────────────────
section("2. void vs undefined — Subtle Difference");
// ────────────────────────────────────────────────────────────

function logMessage(msg: string): void {
  console.log("  [LOG]", msg);
  // no return statement — void
}

// ⚠️ GOTCHA: void-returning callbacks CAN return values — they're just ignored
const results: number[] = [];
[1, 2, 3].forEach(n => results.push(n));  // push returns number, forEach expects void → OK!
console.log("forEach with push (void callback returns number):", results);

// But you can't USE the return value of a void function
const ret = logMessage("test");
// console.log(ret.toString()) ← ERROR: void has no properties
console.log("Return of void function:", ret);  // undefined at runtime

// ────────────────────────────────────────────────────────────
section("3. Function Overloads");
// ────────────────────────────────────────────────────────────

// declaration signatures + one implementation
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): string | number {
  if (typeof input === "string") return Number(input);
  return String(input);
}

const fromString = parse("42");    // type: number
const fromNumber = parse(42);      // type: string

console.log("parse('42'):", fromString, typeof fromString);
console.log("parse(42):", fromNumber, typeof fromNumber);

// 🔍 DEBUGGER: Step into parse() with each input — same function body,
//              but the RETURN TYPE changes based on which overload matched

// Real-world: createElement-style overload
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: "canvas"): HTMLCanvasElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return { tagName: tag } as unknown as HTMLElement;  // simplified for demo
}

const input = createElement("input");   // type: HTMLInputElement
const canvas = createElement("canvas"); // type: HTMLCanvasElement
const div = createElement("div");       // type: HTMLElement

console.log("Overloaded createElement types resolved at compile time");

// ────────────────────────────────────────────────────────────
section("4. Generics — Basics");
// ────────────────────────────────────────────────────────────

function identity<T>(arg: T): T { return arg; }

const str = identity("hello");     // inferred: string
const num = identity(42);          // inferred: number
console.log("identity('hello'):", str, "| identity(42):", num);

// With arrays
function first<T>(arr: T[]): T | undefined { return arr[0]; }
console.log("first([10,20,30]):", first([10, 20, 30]));
console.log("first([]):", first([]));

// ────────────────────────────────────────────────────────────
section("5. Generic Constraints");
// ────────────────────────────────────────────────────────────

// T must have a .length property
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

console.log("getLength('hello'):", getLength("hello"));
console.log("getLength([1,2,3]):", getLength([1, 2, 3]));

//@ts-expect-error — intentional error to show that number doesn't satisfy constraint
getLength(42);  // ← ERROR: number has no .length

console.log("length just need to exist.", getLength ({ length: 10, value: "test" }));  // OK — has .length and other props are fine 

// keyof constraint — like C# nameof but as a type
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Tom", age: 42, role: "lead" };
console.log("getProperty(user, 'name'):", getProperty(user, "name"));
console.log("getProperty(user, 'age'):", getProperty(user, "age"));

//@ts-expect-error — intentional error to show that 'email' is not a valid key of user 
getProperty(user, 'email');  // ← ERROR: 'email' not in keyof user

// ────────────────────────────────────────────────────────────
section("6. Generic Interfaces & Types");
// ────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: Date;
}

interface User { id: string; name: string; }
interface Post { id: string; title: string; body: string; }

// T flows through — fully typed
const userResponse: ApiResponse<User> = {
  data: { id: "1", name: "Tom" },
  status: 200,
  timestamp: new Date(),
};

const postResponse: ApiResponse<Post> = {
  data: { id: "1", title: "TS Guide", body: "..." },
  status: 200,
  timestamp: new Date(),
};

console.log("User response:", userResponse.data.name);   // autocomplete works
console.log("Post response:", postResponse.data.title);   // different shape, same wrapper

// ────────────────────────────────────────────────────────────
section("7. Generic Functions — Real Patterns");
// ────────────────────────────────────────────────────────────

// Merge two objects (like Object.assign but typed)
function merge<A extends object, B extends object>(a: A, b: B): A & B {
  return { ...a, ...b };
}

const merged = merge({ name: "Tom" }, { role: "lead", level: 67 });
console.log("Merged:", merged);
// merged.name  ← autocomplete knows all props from both objects

// Group by a key
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

const people = [
  { name: "Alice", dept: "Eng" },
  { name: "Bob", dept: "Sales" },
  { name: "Carol", dept: "Eng" },
];
const byDept = groupBy(people, p => p.dept);
console.log("Grouped by dept:", byDept);

// ────────────────────────────────────────────────────────────
section("8. Utility Types in Action");
// ────────────────────────────────────────────────────────────

interface FullUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Partial — all optional (good for update payloads)
type UpdateUser = Partial<FullUser>;
const update: UpdateUser = { name: "New Name" };  // only what changed

// Pick — subset
type UserSummary = Pick<FullUser, "id" | "name">;
const summary: UserSummary = { id: "1", name: "Tom" };

// Omit — exclude fields
type PublicUser = Omit<FullUser, "password">;  // everything except password

// Record — dictionary
type RolePermissions = Record<"admin" | "editor" | "viewer", string[]>;
const permissions: RolePermissions = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
};

// ReturnType / Parameters
function createUser(name: string, email: string): FullUser {
  return { id: "1", name, email, password: "hash", createdAt: new Date() };
}

type CreateUserReturn = ReturnType<typeof createUser>;      // FullUser
type CreateUserParams = Parameters<typeof createUser>;      // [string, string]

console.log("Partial update:", update);
console.log("Pick summary:", summary);
console.log("Record permissions:", permissions);

// ────────────────────────────────────────────────────────────
section("9. Mapped Type — Build Your Own Utility");
// ────────────────────────────────────────────────────────────

// Make all properties nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

type NullableUser = Nullable<{ name: string; age: number }>;
const nu: NullableUser = { name: null, age: 42 };  // name can be null
console.log("Nullable user:", nu);

// Getters from object shape
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

const ug: UserGetters = {
  getName: () => "Tom",
  getAge: () => 42,
};
console.log("Mapped getters:", ug.getName(), ug.getAge());

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Try adding your own generics and overloads.\n${"═".repeat(60)}`);
