# Uptimer

Uptimer 是一个 Cloudflare Native 的可用性监控 + 状态页项目（Workers + Pages + D1）。

- Backend: Cloudflare Workers（Hono + Zod）
- Frontend: Cloudflare Pages（React + Vite + Tailwind）
- Database: Cloudflare D1（Drizzle + SQL migrations）

## 核心能力

当前版本包含以下核心能力：

- HTTP/TCP 探测与状态机
- Public Status API + Admin API
- Webhook 通知
- 状态页 + 管理后台
- GitHub Actions 自动部署（Worker + D1 + Pages）

## 文档导航

核心规格与协作约定：

- `AGENTS.md`：仓库工作约定（必读）
- `Develop/Application.md`：产品规格与技术约束
- `Develop/Structure.md`：目录结构与模块边界
- `Develop/Plan.md`：分阶段交付计划
- `Develop/API-Reference.md`：Cloudflare / D1 / 出站探测 API 参考

部署与运维文档：

- `docs/deploy-github-actions.md`：通过 GitHub Actions 发布到 Cloudflare（推荐）
- `docs/configuration-reference.md`：Secrets / Variables / 本地环境配置说明
- `docs/notifications.md`：通知系统（Webhook、模板、签名、排障）
- `Develop/LOCAL-TESTING.md`：本地启动、联调与测试流程

## 本地开发（快速开始）

1) 安装依赖

```bash
pnpm install
```

2) 准备 Worker 本地变量（管理员 Token）

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

3) 一键初始化并启动（推荐）

```bash
pnpm dev
```

默认地址：

- Worker: `http://localhost:8787`
- Web: `http://localhost:5173`

> 完整流程（含种子数据、curl 验证、常见问题）见 `Develop/LOCAL-TESTING.md`。

## 通过 GitHub Actions 部署（推荐）

仓库内已提供：

- `.github/workflows/ci.yml`：Lint + Typecheck + Test
- `.github/workflows/deploy.yml`：一键部署 Worker + D1 + Pages

最小步骤：

1. 在 GitHub 仓库设置 `CLOUDFLARE_API_TOKEN`（必需）
2. （推荐）设置 `CLOUDFLARE_ACCOUNT_ID` 与 `UPTIMER_ADMIN_TOKEN`
3. 推送到 `master` 或 `main`（或手动触发 `Deploy to Cloudflare` workflow）

部署流程会自动：

- 解析/创建 D1 数据库并执行远程 migrations
- 部署 Worker（并可注入 `ADMIN_TOKEN` secret）
- 构建并部署 Pages

详细参数与可选变量见 `docs/deploy-github-actions.md`。

## 质量检查

```bash
pnpm -r lint
pnpm -r typecheck
pnpm -r --if-present test
```
