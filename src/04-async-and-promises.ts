// ============================================================
// 04 — ASYNC & PROMISES
// Run: npx tsx src/04-async-and-promises.ts
// ============================================================

const DIVIDER = "─".repeat(60);
function section(title: string) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }

// ────────────────────────────────────────────────────────────
section("1. Creating Promises");
// ────────────────────────────────────────────────────────────

// A Promise is a container for a future value — like Task<T> in C#
const delayedGreeting = new Promise<string>((resolve, reject) => {
  console.log(`delayedGreeting starts at ${new Date().toLocaleTimeString()}`); 
  setTimeout(() => resolve(`Hello from the future! resolved at ${new Date().toLocaleTimeString()}`), 3000);
});

// .then / .catch / .finally chain
await delayedGreeting
  .then(msg => console.log("  .then:", msg))
  .catch(err => console.error("  .catch:", err))
  .finally(() => console.log(`.finally: always runs. Here it completed at ${new Date().toLocaleTimeString()}`));

 
// ────────────────────────────────────────────────────────────
section("2. async/await — The Preferred Way");
// ────────────────────────────────────────────────────────────

// Simulated API
async function fetchUser(id: number): Promise<{ id: number; name: string }> {
  await new Promise(r => setTimeout(r, 1000));
  if (id === 0) throw new Error("User not found");
 
  return { id, name: `User-${id}` };
}

// ⚠️ GOTCHA: async ALWAYS returns a Promise
async function getValue(): Promise<number> {
  return 42;  // looks like it returns number, but it's Promise<number>
}

const val = getValue();
console.log("getValue() returns:", val);                // Promise { 42 }
console.log("await getValue():", await val);            // 42
// 🔍 DEBUGGER: set breakpoint on both lines — see the Promise wrapper

// ────────────────────────────────────────────────────────────
section("3. Error Handling with async/await");
// ────────────────────────────────────────────────────────────

// try/catch — the standard pattern
async function loadUser(id: number) {
  try {
    const user = await fetchUser(id);
    console.log("  Loaded:", user.name);
    return user;
  } catch (err) {
    // ⚠️ err is `unknown` — must narrow
    if (err instanceof Error) {
      console.log("  Error:", err.message);
    }
    return null;
  }
}

await loadUser(1);   // success
await loadUser(0);   // failure — caught cleanly

// ────────────────────────────────────────────────────────────
section("4. Promise.all — Parallel Execution");
// ────────────────────────────────────────────────────────────

const start = Date.now();
const elapsed = () => `+${Date.now() - start}ms`;

// All run in parallel — total time ≈ slowest, not sum
const [user1, user2, user3] = await Promise.all([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3),
]);

console.log(`  Fetched 3 users in parallel (${elapsed()}):`);
console.log(`  ${user1.name}, ${user2.name}, ${user3.name}`);

// ⚠️ GOTCHA: Promise.all FAILS FAST — one rejection kills everything
console.log("\n⚠️ GOTCHA: Promise.all fails fast:");
try {
  await Promise.all([
    fetchUser(1),
    fetchUser(0),   // this throws
    fetchUser(3),   // this gets cancelled/ignored
  ]);
} catch (err) {
  console.log("  All failed because user 0 threw:", (err as Error).message);
}

// ────────────────────────────────────────────────────────────
section("5. Promise.allSettled — Never Rejects");
// ────────────────────────────────────────────────────────────

const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(0),    // will reject
  fetchUser(3),
]);

results.forEach((result, i) => {
  if (result.status === "fulfilled") {
    console.log(`  [${i}] ✅ ${result.value.name}`);
  } else {
    console.log(`  [${i}] ❌ ${result.reason.message}`);
  }
});
// 🔍 DEBUGGER: inspect `results` — each has { status, value/reason }

// ────────────────────────────────────────────────────────────
section("6. Promise.race vs Promise.any");
// ────────────────────────────────────────────────────────────

async function slow(): Promise<string> {
  await new Promise(r => setTimeout(r, 3000));
  return "slow";
}
async function fast(): Promise<string> {
  await new Promise(r => setTimeout(r, 500));
  return "fast";
}
async function failing(): Promise<string> {
  await new Promise(r => setTimeout(r, 10));
  throw new Error("failed");
}

// race: first to SETTLE (resolve OR reject) wins
const raceResult = await Promise.race([slow(), fast()]);
console.log("Promise.race [slow, fast]:", raceResult);  // "fast"

// ⚠️ GOTCHA: race can return a rejection
try {
  await Promise.race([slow(), failing()]);
} catch (err) {
  console.log("⚠️ race with failing:", (err as Error).message);  // "failed" wins the race
}

// any: first to SUCCEED wins (ignores rejections)
const anyResult = await Promise.any([failing(), slow(), fast()]);
console.log("Promise.any [failing, slow, fast]:", anyResult);  // "fast" — failing is ignored

// ────────────────────────────────────────────────────────────
section("7. Sequential vs Parallel in Loops");
// ────────────────────────────────────────────────────────────

const ids = [1, 2, 3, 4, 5];

// Sequential — each waits for previous
console.log("Sequential:");
const seqStart = Date.now();
const seqResults: string[] = [];
for (const id of ids) {
  const user = await fetchUser(id);
  seqResults.push(user.name);
}
console.log(`  ${seqResults.join(", ")} (${Date.now() - seqStart}ms)`);

// Parallel — all at once
console.log("Parallel:");
const parStart = Date.now();
const parResults = await Promise.all(ids.map(id => fetchUser(id)));
console.log(`  ${parResults.map(u => u.name).join(", ")} (${Date.now() - parStart}ms)`);

// 🔍 DEBUGGER: compare the timings — parallel is ~5x faster here

// ────────────────────────────────────────────────────────────
section("8. Typed Async — Generic Fetch Wrapper");
// ────────────────────────────────────────────────────────────

// Real-world pattern: type-safe API client
interface ApiResponse<T> {
  data: T;
  status: number;
}

async function apiFetch<T>(url: string): Promise<ApiResponse<T>> {
  // Simulated — in real code this would be fetch()
  await new Promise(r => setTimeout(r, 50));
  const mockData = { id: "1", name: "Mock User" } as unknown as T;
  return { data: mockData, status: 200 };
}

interface User { id: string; name: string; }
const response = await apiFetch<User>("/api/users/1");
console.log("Typed API response:", response.data.name);  // autocomplete works on .name

// ────────────────────────────────────────────────────────────
section("9. AbortController — Cancellation");
// ────────────────────────────────────────────────────────────

async function fetchWithTimeout(ms: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    // Simulated long operation
    await new Promise<void>((resolve, reject) => {
      const opTimeout = setTimeout(resolve, 500);     // takes 500ms
      controller.signal.addEventListener("abort", () => {
        clearTimeout(opTimeout);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    return "completed";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled (timeout)";
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

console.log("Fetch with 1000ms timeout:", await fetchWithTimeout(1000));  // completes
console.log("Fetch with 100ms timeout:", await fetchWithTimeout(100));    // cancelled

// ────────────────────────────────────────────────────────────
section("10. Async Patterns — Debounce & Retry");
// ────────────────────────────────────────────────────────────

// Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.log(`  Attempt ${attempt} failed: ${(err as Error).message}`);
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * 2 ** (attempt - 1);  // 100, 200, 400...
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

let callCount = 0;
async function flakyApi(): Promise<string> {
  callCount++;
  if (callCount < 3) throw new Error("server busy");
  return "success!";
}

const retryResult = await withRetry(flakyApi);
console.log("Retry result:", retryResult);

// ────────────────────────────────────────────────────────────
section("11. ⚠️ Common Async Gotchas");
// ────────────────────────────────────────────────────────────

// GOTCHA 1: Forgetting to await
async function gotcha1() {
  const promise = fetchUser(1);     // forgot await!
  console.log("  Without await:", promise);           // Promise { <pending> }
  console.log("  With await:", await promise);        // { id: 1, name: 'User-1' }
}
await gotcha1();

// GOTCHA 2: await in a non-async function
// function gotcha2() {
//   const user = await fetchUser(1);  ← COMPILE ERROR
// }

// GOTCHA 3: Floating promises (fire and forget — unhandled rejections)
console.log("\n⚠️ GOTCHA: floating promise — no await, no .catch():");
console.log("  fetchUser(0);  ← rejection goes unhandled in production!");
console.log("  ✅ Fix: always await or attach .catch()");

// GOTCHA 4: Promise constructor anti-pattern
console.log("\n⚠️ GOTCHA: wrapping existing Promise in new Promise:");
console.log("  ❌ new Promise(async (resolve) => { resolve(await fetch(url)); })");
console.log("  ✅ Just return fetch(url) — it's already a Promise!");

console.log(`\n${"═".repeat(60)}\n  ✅ Done! Try changing timeouts and retry counts.\n${"═".repeat(60)}`);
