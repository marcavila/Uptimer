# GitHub Actions 部署指南（Cloudflare）

本文档说明如何使用仓库内置的 `.github/workflows/deploy.yml` 完成 Uptimer 发布。

适用日期：2026-02-16（与当前仓库 workflow 同步）。

## 1. 部署前提

你需要：

- GitHub 仓库（建议默认分支为 `master` 或 `main`）
- Cloudflare 账号
- 一个具有部署权限的 Cloudflare API Token
- 仓库 Secrets / Variables 配置权限

## 2. Workflow 概览

触发方式：

- `push` 到 `main` 或 `master`
- 手动触发 `workflow_dispatch`

部署文件：`.github/workflows/deploy.yml`

主要动作（按执行顺序）：

1. 安装 Node + pnpm + 依赖
2. 解析 Cloudflare Account ID（优先读仓库配置；缺失时通过 API 查询）
3. 计算资源命名（Worker / Pages / D1）
4. 检查或创建 D1，注入真实 `database_id` 到临时 `wrangler.ci.toml`
5. 远程执行 D1 migrations
6. 部署 Worker
7. （可选）写入 Worker Secret：`ADMIN_TOKEN`
8. 构建并部署 Pages
9. （可选）写入 Pages Secret：`UPTIMER_API_ORIGIN`

## 3. 必配 Secrets / Variables

### 3.1 必需（至少配置一个）

`Secrets`：

- `CLOUDFLARE_API_TOKEN`（必需）

### 3.2 强烈建议配置

`Secrets`：

- `CLOUDFLARE_ACCOUNT_ID`（可选但推荐；可避免自动解析失败）
- `UPTIMER_ADMIN_TOKEN`（推荐；用于自动写入 Worker `ADMIN_TOKEN`）

### 3.3 可选部署变量（Variables）

用于覆盖默认命名与路由：

- `UPTIMER_PREFIX`
- `UPTIMER_WORKER_NAME`
- `UPTIMER_PAGES_PROJECT`
- `UPTIMER_D1_NAME`
- `UPTIMER_D1_BINDING`（默认 `DB`）
- `UPTIMER_API_BASE`（Web 构建时 API Base）
- `UPTIMER_API_ORIGIN`（Pages Secret 值）
- `VITE_ADMIN_PATH` 或 `UPTIMER_ADMIN_PATH`（自定义管理入口路径）

> 说明：若不配置命名变量，workflow 会使用仓库名 slug 作为默认前缀，便于 fork 同步时保持稳定。

## 4. Cloudflare Token 权限建议

由于 workflow 会创建/更新多个资源，Token 需覆盖以下能力：

- Workers 脚本部署与 Secret 管理
- D1 数据库查询/创建/迁移
- Pages 项目创建与部署
- 账号信息读取（用于 account id 解析）

不同 Cloudflare 控制台版本的权限命名可能略有差异，请以“可执行 workflow 中对应 CLI 命令”为准。

## 5. 首次部署步骤（推荐）

1. 在 GitHub 仓库添加 `CLOUDFLARE_API_TOKEN`
2. 添加 `CLOUDFLARE_ACCOUNT_ID`（推荐）
3. 添加 `UPTIMER_ADMIN_TOKEN`（推荐）
4. （可选）设置 `UPTIMER_PREFIX`，避免与其他实例重名
5. 推送到 `master`/`main`，或手动运行 `Deploy to Cloudflare`
6. 等待 workflow 成功后，记录 Worker URL 与 Pages URL

## 6. 部署后验证

### 6.1 基础可用性

- 访问 Pages 首页（状态页）
- 打开管理页面（默认 `/admin`，或 `VITE_ADMIN_PATH` 指定路径）

### 6.2 API 验证

公开 API：

```bash
curl https://<worker-or-domain>/api/v1/public/status
```

管理员 API（需替换 token）：

```bash
curl https://<worker-or-domain>/api/v1/admin/monitors \
  -H "Authorization: Bearer <UPTIMER_ADMIN_TOKEN>"
```

### 6.3 数据库验证（可选）

使用 Wrangler 检查目标 D1 中关键表是否存在：

- `monitors`
- `monitor_state`
- `check_results`
- `outages`
- `settings`

## 7. 常见问题

### Q1: `Resolve Cloudflare Account ID` 失败

排查：

- `CLOUDFLARE_API_TOKEN` 是否存在且有效
- Token 是否有读取账号权限
- 直接设置 `CLOUDFLARE_ACCOUNT_ID` 避免自动查询

### Q2: D1 迁移失败

排查：

- `UPTIMER_D1_BINDING` 是否与 `apps/worker/wrangler.toml` 的 binding 一致
- migration SQL 是否可重复执行/是否存在语法错误

### Q3: Pages 构建成功但前端请求 API 404/HTML

排查：

- `UPTIMER_API_BASE` 是否正确
- 若未设置 `UPTIMER_API_BASE`，workflow 会尝试使用 worker URL + `/api/v1`
- 前端报 “API returned HTML instead of JSON” 通常是 API Base 或路由未对齐

### Q4: 管理端 401

排查：

- `UPTIMER_ADMIN_TOKEN` 是否已写入 Worker Secret
- 浏览器本地存储中的 `admin_token` 是否与 Secret 一致

## 8. 回滚建议

优先采用“重新部署上一个已知可用 commit”：

1. 找到上一个绿色部署 commit
2. 基于该 commit 重新触发 `Deploy to Cloudflare`
3. 若涉及 schema 变更，确认是否需要补充“前向兼容修复”而非回滚 migration

> 对 D1 migration 不建议做 destructive rollback。若已执行远程 migration，优先通过新增 migration 修复。

## 9. 与 CI 的关系

`CI` workflow 负责质量门禁（lint/typecheck/test），`Deploy` 负责发布。

建议分支策略：

- PR 合并前必须通过 CI
- `master`/`main` 仅接收通过评审的变更
- 发布由 `master`/`main` push 自动触发，避免手工漂移
