# Basic English Coach

面向中文零基础成人的 Basic English 学习应用。第一版是本地优先的 Web/PWA：不需要登录，进度保存在浏览器 `localStorage`，课程以 C. K. Ogden Basic English 的 850 核心词为边界。

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

## 运行

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址。当前会话已启动在：

```text
http://127.0.0.1:5175/index.html
```

## 验证

```bash
npm run test
npm run build
npm run build:pages
```

## 部署

项目包含 GitHub Pages 自动部署工作流。推送到 `main` 后，GitHub Actions 会运行 `npm run build:pages`，并把 `dist/` 发布到 GitHub Pages。

第一次部署后，在仓库的 `Settings > Pages` 中确认 Source 为 `GitHub Actions`。

## 资料来源

- [Simple Wiktionary Basic English alphabetical wordlist](https://simple.wiktionary.org/wiki/Wiktionary:Basic_English_alphabetical_wordlist)
- [ZbEnglish Ogden's Basic English Words](https://zbenglish.net/sites/basic/wordalph.html)
- [Basic English overview](https://universalium.en-academic.com/79415/Basic_English)
