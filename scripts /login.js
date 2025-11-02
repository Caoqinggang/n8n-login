/**
 * 自动登录 N8N 并将截图发送至 Telegram
 * 每 7 天执行一次
 */

require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { execSync } = require("child_process");
const path = require("path");
const schedule = require("node-schedule");

const LOGIN_URL = "https://lycc17-n8n-free.hf.space/";
const SCREENSHOT_PATH = path.join(__dirname, "n8n-login.png");

// Telegram 消息发送函数
async function sendToTelegram(filePath, caption) {
  try {
    const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append("chat_id", process.env.TELEGRAM_CHAT_ID);
    formData.append("caption", caption);
    formData.append("photo", fs.createReadStream(filePath));

    await axios.post(telegramApi, formData, { headers: formData.getHeaders() });
    console.log("📤 截图已发送到 Telegram");
  } catch (error) {
    console.error("❌ 发送 Telegram 消息失败:", error.message);
  }
}

// 核心登录逻辑
async function loginAndScreenshot() {
  const SELECTORS = {
    emailInput: 'input[name="email"], input[id="j_username"]',
    passwordInput: 'input[type="password"], input[id="j_password"]',
    submitBtn: 'button[type="submit"], #logOnFormSubmit',
  };

  let browser;
  try {
    console.log("🚀 启动浏览器...");
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      console.warn("⚠️ Chromium 未安装，自动安装中...");
      execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
      browser = await chromium.launch({ headless: true });
    }

    const page = await browser.newPage();
    console.log("🌐 打开登录页面:", LOGIN_URL);
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 填写邮箱和密码
    await page.waitForSelector(SELECTORS.emailInput, { timeout: 20000 });
    await page.fill(SELECTORS.emailInput, process.env.EMAIL);
    await page.waitForSelector(SELECTORS.passwordInput, { timeout: 20000 });
    await page.fill(SELECTORS.passwordInput, process.env.PASSWORD);

    console.log("➡️ 提交登录...");
    await page.click(SELECTORS.submitBtn);
    await page.waitForTimeout(8000);

    // 登录成功截图
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    await sendToTelegram(SCREENSHOT_PATH, "✅ N8N 登录成功截图");

    console.log("🎉 登录任务完成");

  } catch (err) {
    console.error("❌ 登录失败:", err.message);
    try {
      const pages = browser ? await browser.pages() : [];
      if (pages.length > 0) {
        const errorPage = pages[0];
        const errorPath = path.join(__dirname, "login-error.png");
        await errorPage.screenshot({ path: errorPath, fullPage: true });
        await sendToTelegram(errorPath, "🚨 登录失败截图");
      }
    } catch (screenshotErr) {
      console.error("⚠️ 无法截图:", screenshotErr.message);
    }
  } finally {
    if (browser) await browser.close();
  }
}

// 🕒 定时任务：每 7 天执行一次
console.log("📅 启动定时任务：每7天自动登录 N8N");
schedule.scheduleJob("0 0 */7 * *", async () => {
  console.log("⏰ 开始执行自动登录任务...");
  await loginAndScreenshot();
});

// 🚀 首次启动立即执行一次
loginAndScreenshot();
