# 配置说明（Configuration Reference）

本文汇总 Uptimer 当前可配置项，按“部署时 / 运行时 / 本地开发”分类。

## 1. GitHub Actions（部署时）

来源：`.github/workflows/deploy.yml`

### 1.1 Secrets

| 名称 | 必需 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 是 | Cloudflare API 认证（部署 Worker/Pages、管理 D1） |
| `CLOUDFLARE_ACCOUNT_ID` | 否（推荐） | Cloudflare Account ID；未提供时 workflow 尝试自动解析 |
| `UPTIMER_ADMIN_TOKEN` | 否（推荐） | 自动写入 Worker Secret `ADMIN_TOKEN` |
| `VITE_ADMIN_PATH` | 否 | 覆盖管理后台路径（优先级高于变量） |

### 1.2 Variables

| 名称 | 默认值 | 用途 |
| --- | --- | --- |
| `UPTIMER_PREFIX` | 仓库名 slug | 统一资源名前缀 |
| `UPTIMER_WORKER_NAME` | `${UPTIMER_PREFIX}` | Worker 名称 |
| `UPTIMER_PAGES_PROJECT` | `${UPTIMER_PREFIX}` | Pages 项目名 |
| `UPTIMER_D1_NAME` | `${UPTIMER_PREFIX}` | D1 数据库名 |
| `UPTIMER_D1_BINDING` | `DB` | Worker 中 D1 binding 名称 |
| `UPTIMER_API_BASE` | 自动推导或 `/api/v1` | Web 构建时 API 基础路径 |
| `UPTIMER_API_ORIGIN` | 空 | Pages Secret `UPTIMER_API_ORIGIN` 的值 |
| `VITE_ADMIN_PATH` | 空 | 管理后台路径（可被 Secret 覆盖） |
| `UPTIMER_ADMIN_PATH` | 空 | 兼容变量名（供 VITE_ADMIN_PATH fallback 使用） |

## 2. Worker 运行时配置

### 2.1 Secrets（Worker）

| 名称 | 必需 | 用途 |
| --- | --- | --- |
| `ADMIN_TOKEN` | 是 | 管理员 API Bearer Token |

### 2.2 Vars（Worker）

来源：`apps/worker/wrangler.toml` 与 `apps/worker/src/env.ts`

| 名称 | 默认值 | 用途 |
| --- | --- | --- |
| `ADMIN_RATE_LIMIT_MAX` | `60` | 管理端 API 限流窗口内最大请求数 |
| `ADMIN_RATE_LIMIT_WINDOW_SEC` | `60` | 管理端 API 限流窗口长度（秒） |

## 3. Web 构建时配置

来源：`apps/web/.env.example`

| 名称 | 默认值 | 用途 |
| --- | --- | --- |
| `VITE_ADMIN_PATH` | `/admin` | 管理后台路由前缀 |
| `VITE_API_BASE` | `/api/v1`（代码默认） | 前端访问 API 的 base URL |

> 说明：`VITE_API_BASE` 在 CI 中由 deploy workflow 计算并注入（优先变量 `UPTIMER_API_BASE`）。

## 4. D1 Settings（运行时可改）

来源：`apps/worker/src/schemas/settings.ts`

可通过 Admin API `PATCH /api/v1/admin/settings` 更新。

| Key | 说明 |
| --- | --- |
| `site_title` | 状态站点标题 |
| `site_description` | 状态站点描述 |
| `site_locale` | 站点语言（`auto`/`en`/`zh-CN`/`zh-TW`/`ja`/`es`） |
| `site_timezone` | IANA 时区 |
| `retention_check_results_days` | `check_results` 保留天数 |
| `state_failures_to_down_from_up` | UP -> DOWN 所需连续失败次数 |
| `state_successes_to_up_from_down` | DOWN -> UP 所需连续成功次数 |
| `admin_default_overview_range` | 管理后台总览默认范围 |
| `admin_default_monitor_range` | 管理后台监控默认范围 |
| `uptime_rating_level` | Uptime 评级等级 |

## 5. 本地开发配置

### 5.1 Worker

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

至少设置：

```dotenv
ADMIN_TOKEN=changeme
```

### 5.2 Web

可选复制：

```bash
cp apps/web/.env.example apps/web/.env
```

按需设置：

```dotenv
VITE_ADMIN_PATH=/admin
```

## 6. 安全注意事项

- `ADMIN_TOKEN` 仅存储在 Worker Secret 或本地 `.dev.vars`。
- 不要把任何 token 写入 Git 仓库。
- GitHub Actions 中优先使用 Secrets，不要把敏感值放到 Variables。
- 若启用 webhook 签名，secret 请使用 Worker Secret 引用（不要落库）。
