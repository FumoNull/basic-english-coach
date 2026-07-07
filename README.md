# Basic English Coach

面向中文零基础成人的 Basic English 学习应用。第一版是本地优先的 Web/PWA：不登录也能学习，进度保存在浏览器 `localStorage`；配置 Supabase 后，可用邮箱登录在手机和电脑之间同步进度。课程以 C. K. Ogden Basic English 的 850 核心词为边界。

在线版本计划部署到：

```text
https://fumonull.github.io/basic-english-coach/
```

## 功能

- 84 天课程路径，每天约 20 分钟。
- 每课包含听、选、排、拼、写、说、复习 7 个小任务。
- 使用浏览器 `speechSynthesis` 播放英文。
- 支持浏览器语音识别时自动评分跟读；不支持时降级为自评完成。
- 规则评分会检查大小写/标点容错、词序、缺词/多词和非 Basic English 词。
- 本地优先保存学习进度；可选 Supabase 邮箱登录云同步。
- 没有配置云同步时，可用“复制进度码 / 导入进度码”在手机和电脑之间手动迁移进度。

## 运行

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址。当前会话已启动在：

```text
http://127.0.0.1:5175/index.html
```

如需在本地调试云同步，复制 `.env.example` 为 `.env.local`，填入：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## 验证

```bash
npm run test
npm run build
npm run build:pages
npm run check:sync
```

## 部署

项目包含 GitHub Pages 自动部署工作流。推送到 `main` 后，GitHub Actions 会运行 `npm run build:pages`，并把 `dist/` 发布到 GitHub Pages。

第一次部署后，在仓库的 `Settings > Pages` 中确认 Source 为 `GitHub Actions`。

### 开启云同步

1. 在 Supabase 新建项目。
2. 打开 Supabase SQL Editor，执行 [supabase.sql](./supabase.sql)。
3. 在 Supabase `Authentication > URL Configuration` 中设置：
   - Site URL: `https://fumonull.github.io/basic-english-coach/`
   - Redirect URLs:
     - `https://fumonull.github.io/basic-english-coach/`
     - `https://fumonull.github.io/basic-english-coach/index.html`
     - `http://127.0.0.1:5175/`
     - `http://127.0.0.1:5175/index.html`
4. 在 GitHub 仓库 `Settings > Secrets and variables > Actions > Variables` 添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 推送到 `main` 或手动运行 Pages workflow。
6. 部署完成后运行 `npm run check:sync:required`。如果命令通过，说明线上包已经注入 Supabase 配置；如果失败，网站仍会停留在本机保存和进度码迁移模式。

云同步采用本地优先策略：离线时仍会保存在本机；登录后会把本地和云端进度合并，已完成活动取并集，当前天数取更靠后的进度，词汇掌握度保留更高记录。

### 手动迁移进度

在任意设备点击“复制进度码”，把生成的进度码发到另一台设备，再点击“导入进度码”并“合并导入”。导入不会简单覆盖当前设备进度，而是和当前本地记录合并。

## 资料来源

- [Simple Wiktionary Basic English alphabetical wordlist](https://simple.wiktionary.org/wiki/Wiktionary:Basic_English_alphabetical_wordlist)
- [ZbEnglish Ogden's Basic English Words](https://zbenglish.net/sites/basic/wordalph.html)
- [Basic English overview](https://universalium.en-academic.com/79415/Basic_English)
