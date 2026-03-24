// ============================================================
// 03 — LOOPS & ITERATION
// Run: npx tsx src/03-loops-and-iteration.ts
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. Classic for Loop");
// ────────────────────────────────────────────────────────────

const items = ["alpha", "bravo", "charlie"];

for (let i = 0; i < items.length; i++) {
  console.log(`  [${i}] ${items[i]}`);
}
// Use when: you need the index, early exit, or non-standard step

// ────────────────────────────────────────────────────────────
section("2. for...of — ✅ Preferred for Arrays");
// ────────────────────────────────────────────────────────────

for (const item of items) {
  console.log(`  ${item}`);
}

// With index via .entries()
for (const [i, item] of items.entries()) {
  console.log(`  [${i}] ${item}`);
}

// Works on strings, Maps, Sets, anything iterable
for (const char of "Hello") {
  process.stdout.write(char + " ");
}
console.log("← string iteration");

// ────────────────────────────────────────────────────────────
section("3. for...in — Objects Only (⚠️ Not Arrays!)");
// ────────────────────────────────────────────────────────────

const config = { host: "localhost", port: 3000, debug: true };

for (const key in config) {
  // ⚠️ key is `string`, not `keyof typeof config`
  console.log(`  ${key}: ${config[key as keyof typeof config]}`);
}

// ⚠️ GOTCHA: for...in on arrays — string indices + prototype chain
const arr = [10, 20, 30];
console.log("\n⚠️ GOTCHA — for...in on an array:");
for (const key in arr) {
  console.log(`  key: "${key}" (type: ${typeof key}) → value: ${arr[key as any]}`);
  // keys are STRINGS "0", "1", "2" — not numbers!
}

// Worse: prototype pollution shows up
(Array.prototype as any).customProp = "oops";
console.log("\nAfter adding Array.prototype.customProp:");
for (const key in arr) {
  console.log(`  key: "${key}"`);  // includes "customProp"!
}
delete (Array.prototype as any).customProp;
console.log("  → for...in iterates prototype chain. NEVER use on arrays.");

// ────────────────────────────────────────────────────────────
section("4. while & do...while");
// ────────────────────────────────────────────────────────────

// Countdown
let count = 5;
process.stdout.write("  while countdown: ");
while (count > 0) {
  process.stdout.write(`${count} `);
  count--;
}
console.log("🚀");

// do...while — always executes at least once
let attempts = 0;
do {
  attempts++;
  const success = attempts >= 3;
  if (success) {
    console.log(`  do...while: succeeded on attempt ${attempts}`);
    break;
  }
} while (attempts < 5);

// ────────────────────────────────────────────────────────────
section("5. forEach — Caveats");
// ────────────────────────────────────────────────────────────

const nums = [1, 2, 3, 4, 5];

// Basic usage
console.log("forEach basic:");
nums.forEach((val, idx) => {
  console.log(`  [${idx}] ${val}`);
});

// ⚠️ GOTCHA 1: Can't break out of forEach
console.log("\n⚠️ GOTCHA: 'break' inside forEach? Doesn't exist.");
console.log("  Using return only skips current iteration (like continue):");
nums.forEach(n => {
  if (n === 3) return;  // this is NOT a break — it's continue
  console.log(`  ${n}`);
});
console.log("  → 3 was skipped but 4 and 5 still ran");

// ✅ Use for...of when you need break
console.log("\n✅ for...of with break:");
for (const n of nums) {
  if (n === 3) break;
  console.log(`  ${n}`);
}
console.log("  → stopped at 3");

// ────────────────────────────────────────────────────────────
section("6. ⚠️ forEach + async — The Classic Trap");
// ────────────────────────────────────────────────────────────

async function fetchItem(id: number): Promise<string> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 100));
  return `item-${id}`;
}

// ❌ WRONG: forEach doesn't await — fires all in parallel, returns void
console.log("❌ forEach + async (fires in parallel, doesn't await):");
const startBad = Date.now();
[1, 2, 3].forEach(async (id) => {
  const result = await fetchItem(id);
  console.log(`  forEach: ${result} at +${Date.now() - startBad}ms`);
});
// 🔍 DEBUGGER: notice the timestamps — they're all ~100ms, not 100/200/300

// Give forEach time to finish before sequential demo
await new Promise(r => setTimeout(r, 500));

// ✅ CORRECT: for...of awaits sequentially
console.log("\n✅ for...of + await (sequential):");
const startGood = Date.now();
for (const id of [1, 2, 3]) {
  const result = await fetchItem(id);
  console.log(`  for...of: ${result} at +${Date.now() - startGood}ms`);
}
// 🔍 DEBUGGER: timestamps are ~100/200/300 — truly sequential

// ✅ ALSO CORRECT: Promise.all for intentional parallel
console.log("\n✅ Promise.all (intentional parallel):");
const startParallel = Date.now();
const results = await Promise.all([1, 2, 3].map(id => fetchItem(id)));
results.forEach(r => console.log(`  Promise.all: ${r} at +${Date.now() - startParallel}ms`));

// ────────────────────────────────────────────────────────────
section("7. Functional Methods: map / filter / reduce");
// ────────────────────────────────────────────────────────────

const data = [
  { name: "Alice", score: 85 },
  { name: "Bob", score: 92 },
  { name: "Carol", score: 78 },
  { name: "Dave", score: 95 },
];

// map — transform each element (returns new array)
const names = data.map(d => d.name);
console.log("map → names:", names);

// filter — subset matching condition
const topScorers = data.filter(d => d.score >= 90);
console.log("filter → 90+:", topScorers.map(d => d.name));

// reduce — accumulate to single value
const total = data.reduce((sum, d) => sum + d.score, 0);
const average = total / data.length;
console.log("reduce → average score:", average);

// Chaining
const report = data
  .filter(d => d.score >= 80)
  .map(d => `${d.name}: ${d.score}`)
  .join(" | ");
console.log("Chained:", report);

// find / findIndex — first match
const found = data.find(d => d.name === "Carol");
console.log("find Carol:", found);

// some / every — boolean checks
console.log("some score > 90:", data.some(d => d.score > 90));
console.log("every score > 70:", data.every(d => d.score > 70));

// ────────────────────────────────────────────────────────────
section("8. Map & Set Iteration");
// ────────────────────────────────────────────────────────────

const userMap = new Map<string, number>([
  ["Alice", 85],
  ["Bob", 92],
  ["Carol", 78],
]);

console.log("Map with for...of:");
for (const [name, score] of userMap) {
  console.log(`  ${name}: ${score}`);
}

console.log("\nMap methods:");
console.log("  keys:", [...userMap.keys()]);
console.log("  values:", [...userMap.values()]);
console.log("  has('Bob'):", userMap.has("Bob"));

const uniqueScores = new Set([85, 92, 78, 85, 92]);  // deduplicates
console.log("\nSet:", [...uniqueScores]);               // [85, 92, 78]

for (const score of uniqueScores) {
  console.log(`  score: ${score}`);
}

// ────────────────────────────────────────────────────────────
section("9. ⚠️ noUncheckedIndexedAccess in Loops");
// ────────────────────────────────────────────────────────────

const safeArr = [10, 20, 30];

// With noUncheckedIndexedAccess: true (our tsconfig)
const firstItem = safeArr[0];       // type: number | undefined ← not just number!
console.log("safeArr[0]:", firstItem);
console.log("safeArr[99]:", safeArr[99]);  // undefined — and the TYPE knows it

// ✅ You must check before using
if (firstItem !== undefined) {
  console.log("Safe access:", firstItem.toFixed(2));   // ✅ narrowed to number
}

// ✅ Or use non-null assertion if you're SURE
const definitelyExists = safeArr[0]!;                  // ⚠️ you're taking responsibility
console.log("Asserted access:", definitelyExists.toFixed(2));

// 🔍 DEBUGGER EXERCISE: try accessing safeArr[99]! — compiles but crashes at runtime

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Try swapping for...of / forEach to see behavior change.\n${"═".repeat(60)}`);
