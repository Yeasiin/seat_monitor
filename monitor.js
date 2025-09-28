import axios from "axios";
import { config } from "dotenv";
config();

const roll = process.env.ROLL;
const reg = process.env.REG;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TARGET_COURSE_ID = "2681"; // Management

const API_URL = `http://app7.nu.edu.bd/nu-web/msapplication/privatePreliEligibleCollegeCourses?honsRoll=${roll}&honsRegno=${reg}&honsPassingYear=2022&collegeCode=4306&gender=M&honsDegreeName=Degree+Pass`;

// Settings
const TIMEOUT_MS = 30000; // 30 seconds timeout
const MAX_RETRIES = 3; // retry failed requests
let alerted = false; // track if seat alert was already sent

async function sendTelegram(message) {
  try {
    await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        params: {
          chat_id: CHAT_ID,
          text: message,
        },
      }
    );
  } catch (err) {
    console.error("❌ Failed to send Telegram message:", err.message);
  }
}

function makeUserAgent() {
  return `NU-Seat-Monitor/1.0 (contact: your-email@example.com)`;
}

// Retry wrapper
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: { "User-Agent": makeUserAgent(), Accept: "application/json" },
        validateStatus: null,
      });

      if (res.status === 429) {
        const waitSec = res.headers["retry-after"]
          ? parseInt(res.headers["retry-after"], 10)
          : 60;
        throw {
          type: "retry-after",
          waitSec,
          message: "429 Too Many Requests",
        };
      }

      if (res.status >= 500)
        throw { type: "server-error", message: `Server error ${res.status}` };
      if (res.status !== 200)
        throw {
          type: "bad-status",
          message: `Unexpected status ${res.status}`,
        };

      return res.data;
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed: ${err.message || err}`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 5000)); // wait 5 sec before retry
    }
  }
}

async function checkSeats() {
  try {
    const data = await fetchWithRetry(API_URL);
    const target = data?.courses?.find((c) => c.courseId === TARGET_COURSE_ID);

    if (!target) {
      await sendTelegram(`⚠️ Target course not found in API response.`);
      return;
    }

    const available = parseInt(target.availableSeats, 10) || 0;

    if (available > 0) {
      if (!alerted) {
        await sendTelegram(
          `🎉 Seats available for ${target.courseName}! (${available} left)`
        );
        alerted = true;
        console.log(`✅ Alert sent: ${target.courseName} (${available} seats)`);
      } else {
        console.log(`✅ Seats available, already alerted`);
      }
    } else {
      alerted = false; // reset alert when no seats
      console.log(`❌ No seats yet for ${target.courseName}`);
    }
  } catch (error) {
    console.error("🚨 Monitor error:", error.message || error);
    await sendTelegram(`🚨 API check failed: ${error.message || error}`);
  }
}

// Run once (for GitHub Actions / cron)
checkSeats().catch(() => process.exit(1));
