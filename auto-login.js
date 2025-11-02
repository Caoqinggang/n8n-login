require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const { execSync } = require("child_process");

async function sendToTelegram(filePath, caption) {
  try {
    const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append("chat_id", process.env.TELEGRAM_CHAT_ID);
    formData.append("caption", caption);
    formData.append("photo", fs.createReadStream(filePath));

    await axios.post(telegramApi, formData, {
      headers: formData.getHeaders(),
    });

    console.log("📤 截图已发送到 Telegram");
  } catch (error) {
    console.error("❌ Telegram 发送失败:", error.message);
  }
}

(async () => {
  const LOGIN_URL = "https://lycc17-n8n-free.hf.space/";
  const SELECTORS = {
    emailInput: 'input[name="email"], input[id="j_username"]',
    passwordInput: 'input[type="password"], input[id="j_password"]',
    submitBtn: 'button[type="submit"], #logOnFormSubmit',
  };

  const screenshotPath = path.join(__dirname, "login-success.png");

  let browser;

  try {
    console.log("🚀 启动 Chrome 浏览器...");

    // ✅ 检查系统 Chrome 路径
    let chromePath = null;
    const possiblePaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        chromePath = p;
        break;
      }
    }

    if (!chromePath) {
      console.warn("⚠️ 未检测到系统 Chrome，改用 Playwright 内置 Chromium。");
      browser = await chromium.launch({ headless: true });
    } else {
      console.log(`🧭 使用系统 Chrome: ${chromePath}`);
      browser = await chromium.launch({
        headless: true,
        executablePath: chromePath, // ✅ 使用本机 Chrome
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
          "--disable-gpu"
        ]
      });
    }

    const page = await browser.newPage();
    console.log("🌐 打开登录页面:", LOGIN_URL);
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 登录流程
    await page.waitForSelector(SELECTORS.emailInput, { timeout: 20000 });
    await page.fill(SELECTORS.emailInput, process.env.EMAIL);

    await page.waitForSelector(SELECTORS.passwordInput, { timeout: 20000 });
    await page.fill(SELECTORS.passwordInput, process.env.PASSWORD);

    console.log("➡️ 点击登录按钮...");
    await page.click(SELECTORS.submitBtn);
    await page.waitForTimeout(8000);

    // 截图
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await sendToTelegram(screenshotPath, "✅ 使用 Chrome 登录成功截图");

    console.log("🎉 登录完成");

  } catch (err) {
    console.error("❌ 登录失败:", err);
    try {
      const errorPath = path.join(__dirname, "login-error.png");
      const pages = browser ? await browser.pages() : [];
      if (pages.length > 0) {
        await pages[0].screenshot({ path: errorPath, fullPage: true });
        await sendToTelegram(errorPath, "🚨 Chrome 登录失败截图");
      }
    } catch (e) {
      console.error("⚠️ 无法截图:", e.message);
    }
  } finally {
    if (browser) await browser.close();
  }
})();
