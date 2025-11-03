# Auto N8N Login GitHub Action

云端部署的n8n一段时间不登录，数据库可能会被暂停，
这里部署一个自动化程序，
自动化登录 n8n 并将登录截图发送到 Telegram，每 7 天自动运行一次，支持手动触发。

## 功能

- 🕹 自动访问 n8n 登录页面
- ✉️ 自动填充邮箱和密码
- 🔑 自动点击登录按钮
- 📸 登录成功或失败截图
- 📲 将截图发送到 Telegram
- ⏰ GitHub Actions 定时运行（每 7 天一次）或手动触发

---

## 文件结构

```
.
├── auto-login.js       # 自动登录脚本
├── package.json        # Node.js 项目依赖
├── package-lock.json
└── .github/workflows/
    └── auto-login.yml  # GitHub Actions Workflow
```

---

## 配置环境变量

在 GitHub 仓库中 **Settings → Secrets → Actions** 中添加以下 Secrets：

| 变量名                 | 说明 |
|------------------------|------|
| `EMAIL`                | n8n 登录邮箱 |
| `PASSWORD`             | n8n 登录密码 |
| `TELEGRAM_BOT_TOKEN`   | Telegram 机器人 Token（形如 `123456:ABC-xyz`） |
| `TELEGRAM_CHAT_ID`     | Telegram 聊天 ID（可用 `@username` 或数字 chat_id） |

本地调试时，也可以在终端中设置：

```bash
export EMAIL="you@example.com"
export PASSWORD="your_password"
export TELEGRAM_BOT_TOKEN="123456:ABCxyz"
export TELEGRAM_CHAT_ID="123456789"
```

---

## 使用说明

1. 克隆仓库

```bash
git clone <your-repo-url>
cd <your-repo>
```

2. 安装依赖

```bash
npm install
npx playwright install --with-deps chromium
```

3. 本地测试运行

```bash
node auto-login.js
```

4. GitHub Actions

Workflow `.github/workflows/auto-login.yml` 会自动每 7 天运行一次，也可以在 Actions 页面手动触发。

---

## 注意事项

- n8n 登录页面路径需要根据实际自行修改，auto-login.js文件第33行。
- n8n 登录页面路径可能因版本或部署方式不同，请确认 `auto-login.js` 中 `page.goto()` 的 URL 是否正确。
- Playwright 运行时可增加 `headless: false` 进行调试，方便确认选择器。
- 如果 Telegram 消息发送失败，可在 GitHub Actions Artifact 中下载截图。

---

## 可选优化

- 自动检测登录成功（判断是否进入 n8n 主界面）
- 登录失败自动重试
- Telegram 通知和 GitHub Artifact 双保险

---

## 许可证

MIT License

