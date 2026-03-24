// ============================================================
// 01 — PRIMITIVES, DECLARATIONS & TYPE SYSTEM
// Run: npx tsx src/01-primitives-and-types.ts
// Tip: Set breakpoints on any console.log line, then step through
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. Inference vs Explicit Typing");
// ────────────────────────────────────────────────────────────

let inferredString = "hello";       // hover in IDE: string
const literalConst = "hello";       // hover in IDE: "hello" (literal type!)
const PORT = 3000;                  // hover: 3000, not number

console.log("inferredString type at runtime:", typeof inferredString);  // "string"
console.log("PORT value:", PORT);   // 3000

// 🔍 DEBUGGER EXERCISE: hover over `literalConst` — it's narrower than `string`
// This matters when you pass it to a function expecting a specific literal union.

// ────────────────────────────────────────────────────────────
section("2. Number — There Is Only One");
// ────────────────────────────────────────────────────────────

let integer = 42;
let float = 3.14;
let hex = 0xff;
let binary = 0b1010;
let octal = 0o777;
let big = 100n;                     // bigint — different type entirely

console.log("integer:", integer, "| float:", float);
console.log("hex:", hex, "| binary:", binary, "| octal:", octal);
console.log(`hex: 0x${hex.toString(16)}, binary: 0b${binary.toString(2)}, | octal: 0o${octal.toString(8)}`);

console.log("bigint:", big, "| typeof:", typeof big);

// ⚠️ GOTCHA: bigint and number can't mix
try {
  // @ts-expect-error — intentional demo of the gotcha
  const mixed = integer + big;
  console.log(mixed);
} catch (e) {
  console.log("⚠️ GOTCHA: Can't mix number + bigint →", (e as Error).message);
}

// ────────────────────────────────────────────────────────────
section("3. Arrays & Tuples");
// ────────────────────────────────────────────────────────────

const nums: number[] = [1, 2, 3];
const mixed: (string | number)[] = [1, "two", 3];

// Tuples: fixed length + typed positions
let pair: [string, number] = ["age", 42];
const [label, value] = pair;        // destructuring works
console.log("Tuple destructured:", label, value);

// ⚠️ GOTCHA: tuples don't enforce length at runtime
pair.push("extra" as any);          // no compile error with .push()!
console.log("⚠️ GOTCHA: tuple after push:", pair, "| length:", pair.length);
// The type says [string, number] but it's now 3 elements

// ────────────────────────────────────────────────────────────
section("4. Enums — The Gotchas");
// ────────────────────────────────────────────────────────────

enum Direction { Up, Down, Left, Right }
enum Status { Active = "ACTIVE", Idle = "IDLE" }

console.log("Numeric enum → Direction.Up:", Direction.Up);         // 0
console.log("Reverse lookup → Direction[0]:", Direction[0]);       // "Up"
console.log("String enum → Status.Active:", Status.Active);        // "ACTIVE"

// ⚠️ GOTCHA: numeric enums accept ANY number
 
// @ts-expect-error — intentional error 
const bogus: Direction = 99;        // compiles! no error!
console.log("⚠️ GOTCHA: bogus Direction:", bogus, "— no error at compile or runtime");
 

// ✅ Better: string enums or const objects
const Color = {
  Red: "red",
  Green: "green",
  Blue: "blue",
} as const;

type Color = typeof Color[keyof typeof Color];  // "red" | "green" | "blue"
let myColor: Color = "red";       // ✅ type-safe, no reverse lookup weirdness
console.log("as const Color:", myColor);

// @ts-expect-error — intentional error 
myColor = 'pink' // ❌ ERROR: not assignable to type 'Color' (which is "red" | "green" | "blue")

// ────────────────────────────────────────────────────────────
section("5. Union & Intersection Types");
// ────────────────────────────────────────────────────────────

type Id = string | number;

function printId(id: Id) {
  // 🔍 DEBUGGER: step into each branch — watch `id` type narrow
  if (typeof id === "string") {
    console.log("String ID (uppercased):", id.toUpperCase());
  } else {
    console.log("Numeric ID (doubled):", id * 2);
  }
}
printId("abc-123");
printId(42);

// Intersection: combine types
type HasName = { name: string };
type HasEmail = { email: string };
type Contact = HasName & HasEmail;

const contact: Contact = { name: "Jaime", email: "j@ms.com" };
console.log("Intersection type:", contact);

// ────────────────────────────────────────────────────────────
section("6. Literal Types & Discriminated Unions");
// ────────────────────────────────────────────────────────────

type Theme = "light" | "dark";
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  // 🔍 DEBUGGER: set breakpoint here, pass different shapes
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;   // compiler knows `radius` exists
    case "rect":
      return shape.width * shape.height;     // compiler knows `width` & `height`
  }
}

console.log("Circle area:", area({ kind: "circle", radius: 5 }).toFixed(2));
console.log("Rect area:", area({ kind: "rect", width: 4, height: 6 }));

// ────────────────────────────────────────────────────────────
section("7. Type Narrowing Deep Dive");
// ────────────────────────────────────────────────────────────

// typeof
function process(val: string | number | boolean | null) {
  if (val === null) {
    console.log("  null branch");
    return;
  }
  if (typeof val === "string") {
    console.log("  string branch:", val.toUpperCase());
    return;
  }
  if (typeof val === "number") {
    console.log("  number branch:", val.toFixed(2));
    return;
  }
  // 🔍 DEBUGGER: what's the type of `val` here?
  console.log("  boolean branch:", val);  // only boolean is left
}

console.log("Narrowing demo:");
process("hello");
process(3.14);
process(true);
process(null);

// `in` narrowing
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}

move({ swim: () => console.log("  🐟 swimming!") });
move({ fly: () => console.log("  🐦 flying!") });

// ────────────────────────────────────────────────────────────
section("8. satisfies — Validate Without Widening");
// ────────────────────────────────────────────────────────────

// Without satisfies: annotation widens the type
const paletteWide: Record<string, string | number[]> = {
  red: [255, 0, 0],
  green: "#00ff00",
};
// paletteWide.green.toUpperCase() ← ERROR: might be number[]

// With satisfies: validated BUT each value keeps its narrow type
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Record<string, string | number[]>;

console.log("palette.green.toUpperCase():", palette.green.toUpperCase());  // ✅ knows it's string
console.log("palette.red.map(n => n*2):", palette.red.map(n => n * 2));    // ✅ knows it's number[]

console.log("palette.blue.map(n => n*2):", palette.blue.map(n => n  + 20 ));  // just for fun — still knows it's number[] 
// ────────────────────────────────────────────────────────────
section("9. Excess Property Checking Gotcha");
// ────────────────────────────────────────────────────────────

interface Config {
  port: number;
  host: string;
}

// ❌ Direct assignment: excess property caught
// const cfg: Config = { port: 3000, host: "localhost", debug: true , randomstring ="random"}; // ERROR

// ✅ Via intermediate variable: excess property ALLOWED
const raw = { port: 3000, host: "localhost", debug: true, extra: "stuff" };
const cfg: Config = raw;            // no error!
console.log("⚠️ GOTCHA: Config accepted extra props:", cfg);

raw.debug = false ;  // cfg.port also changes, since it's the same object 

//@ts-expect-error — intentional error to show that debug is still there at runtime
cfg.debug = true ; 

console.log("  debug exists at runtime:", (cfg as any).debug);  // true — it's there!
const cfg2: Config = { ...raw };         // no error, but debug is lost in the spread 
//@ts-expect-error — intentional error to show that debug is still there at runtime
console.log(`in cfg2: ${cfg2}, random lost in spread: ${cfg2.random} but port is still there: ${cfg2.port} `);  // undefined
// ────────────────────────────────────────────────────────────
section("10. Readonly & as const");
// ────────────────────────────────────────────────────────────

const API_CONFIG = {
  baseUrl: "https://api.example.com",
  version: "v2",
  retries: 3,
} as const;

//@ts-expect-error — intentional error
API_CONFIG.retries = 5;  //← ERROR: readonly

type ApiVersion = typeof API_CONFIG.version;  // literal type "v2", not string
console.log("as const config:", API_CONFIG);
console.log("version type is literal 'v2', not just string");

// Readonly utility
interface MutableUser { name: string; age: number }
const frozen: Readonly<MutableUser> = { name: "Jaime", age: 42 };

// @ts-expect-error — intentional error
frozen.age = 43; // ← ERROR at compile time
console.log("Readonly user:", frozen);

// ⚠️ GOTCHA: Readonly is shallow — nested objects are still mutable
interface DeepObj { level: number , settings: { theme: string , level: number } }
const obj: Readonly<DeepObj> = { level : 1 , settings: { theme: "dark" , level : 2} };

//@ts-expect-error — intentional error 
obj.level = 2; 
obj.settings.level = 3;   // ← NO error! Still mutable
obj.settings.theme = "light";       // ← NO error! Readonly is shallow
console.log("⚠️ GOTCHA: Readonly is shallow — nested mutated:", obj.settings.theme);

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Experiment by changing values and re-running.\n${"═".repeat(60)}`);
