import axios from "axios";
import { config } from "dotenv";
config();

const roll = process.env.ROLL;
const reg = process.env.REG;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TARGET_COURSE_ID = "2681"; // Management

const API_URL = `http://app7.nu.edu.bd/nu-web/msapplication/privatePreliEligibleCollegeCourses?honsRoll=${roll}&honsRegno=${reg}&honsPassingYear=2022&collegeCode=4306&gender=M&honsDegreeName=Degree+Pass`;

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

async function checkSeats() {
  try {
    const { data } = await axios.get(API_URL, { timeout: 10000 });

    const target = data.courses.find((c) => c.courseId === TARGET_COURSE_ID);

    if (!target) {
      await sendTelegram("⚠️ Target course not found in API response.");
      return;
    }

    const available = parseInt(target.availableSeats, 10);

    if (available > 0) {
      await sendTelegram(
        `🎉 Seats available for ${target.courseName}! (${available} left)`
      );
      console.log(`✅ Alert sent: ${target.courseName} (${available} seats)`);
    } else {
      console.log(`❌ No seats yet for ${target.courseName}`);
    }
  } catch (error) {
    console.error("Error checking API:", error.message);
    await sendTelegram(`🚨 API check failed: ${error.message}`);
  }
}

checkSeats();
