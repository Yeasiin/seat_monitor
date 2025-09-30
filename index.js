import { checkSeats } from "./monitor";

// monitor.js
console.log("Starting seat monitor...");

async function runTask() {
  console.log("⏳ Running at", new Date().toLocaleTimeString());
  try {
    checkSeats().catch(() => process.exit(1));
    console.log("✅ Task completed");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Run immediately
runTask();

// Run every 3 minutes (180,000 ms)
setInterval(runTask, 1 * 30 * 1000);
