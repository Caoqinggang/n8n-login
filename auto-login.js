// auto-login.js
const { chromium } = require("playwright");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function sendToTelegram(filePath, caption) {
  const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const formData = new FormData();
  formData.append("chat_id", process.env.TELEGRAM_CHAT_ID);
  formData.append("caption", caption);
  formData.append("photo", fs.createReadStream(filePath));

  await axios.post(telegramApi, formData, { headers: formData.getHeaders() });
}

(async () => {
  const SELECTORS = {
    emailInput: 'input[placeholder="Email"], input[type="email"]',
    passwordInput: 'input[placeholder="Password"], input[type="password"]',
    passwordSubmit: 'button[type="submit"], button:has-text("Sign in")',
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,  // 无界面运行
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    console.log("🌐 打开登录页面...");
    await page.goto("https://lycc17-n8n-free.hf.space/", { waitUntil: "networkidle" });

    console.log("✉️ 输入邮箱...");
    await page.waitForSelector(SELECTORS.emailInput, { timeout: 15000 });
    await page.fill(SELECTORS.emailInput, process.env.EMAIL);

    console.log("🔑 输入密码...");
    await page.fill(SELECTORS.passwordInput, process.env.PASSWORD);

    console.log("➡️ 点击登录...");
    await page.click(SELECTORS.passwordSubmit);

    // 等待跳转
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(10000);

    // 检查是否登录成功
    const screenshotPath = "login-success.png";
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await sendToTelegram(screenshotPath, "✅ n8n 登录成功截图");

    console.log("🎉 登录成功截图已发送到 Telegram！");
  } catch (err) {
    console.error("❌ 登录失败:", err);
    if (browser) {
      const page = (await browser.pages())[0];
      const errorPath = "error.png";
      await page.screenshot({ path: errorPath, fullPage: true });
      await sendToTelegram(errorPath, "🚨 登录失败截图");
    }
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
