# material_collect_system API Server

`material_collect_system` 的后端接口，提供预设内容包、预设分类、媒体图片库和 API 调试面板。

## 技术栈

- **NestJS 12**（Express 适配器，纯 ESM）
- **Node.js >= 22.12**（使用内置 `node:sqlite`）
- **SQLite**：WAL、外键、busy timeout、版本化迁移
- **class-validator / class-transformer**：请求 DTO 校验
- **Swagger / OpenAPI**：交互式接口文档
- **Multer**：内存接收上传，校验通过后再落盘

所有接口保持统一响应格式：

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

成功时 HTTP 状态码为 `200`；参数错误、资源不存在和服务器错误会返回真实 HTTP 状态码，同时保持相同响应结构（此时 `code` 为 HTTP 状态码）。

## 快速开始

```bash
npm install
npm run build
npm start
```

默认地址：

- API：`http://127.0.0.1:3501`
- Swagger：`http://127.0.0.1:3501/docs`
- OpenAPI JSON：`http://127.0.0.1:3501/docs-json`
- 调试面板：`http://127.0.0.1:3501/panel`

开发模式：

```bash
npm run start:dev
```

首次启动会自动创建数据库表、迁移记录、5 个行业分类和 9 条内容包种子数据。运行时目录（数据库、WAL、上传文件）已被 `.gitignore` 排除。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run build` | 编译到 `dist/`，同时复制调试面板静态资源 |
| `npm start` | 运行 `dist/main.js` |
| `npm run start:dev` | Nest watch 模式 |
| `npm run start:prod` | 生产启动（同 `npm start`） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 单元测试 |
| `npm run test:e2e` | 使用临时 SQLite 数据库的 e2e 测试 |
| `npm run test:cov` | 单元测试覆盖率 |

> NestJS 12 使用 ESM。新增相对导入时必须保留 `.js` 后缀，例如 `import { Foo } from "./foo.js";`。

## 环境变量

支持 `.env` 与 `.env.local`，`.env.local` 优先。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3501` | HTTP 端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `CORS_ORIGINS` | `*` | `*` 或逗号分隔的允许来源 |
| `PANEL_ENABLED` | `true` | 是否开放 `/panel` 调试面板 |
| `DB_FILE` | `src/data/app.db` | SQLite 文件路径 |
| `UPLOAD_DIR` | `src/data/uploads` | 图片落盘目录 |
| `UPLOAD_URL_PREFIX` | `/uploads` | 图片 URL 前缀 |
| `MAX_UPLOAD_SIZE` | `20971520` | 最大上传字节数（20MB） |
| `ALLOWED_IMAGE_TYPES` | `jpg,jpeg,png,gif,webp,bmp,avif` | 允许的图片扩展名 |
| `DEFAULT_LANG` | `en` | 默认语言，必须包含在 `SUPPORTED_LANGS` 中 |
| `SUPPORTED_LANGS` | `en` | 逗号分隔的允许语言 |

参考 `.env.example`。

## 目录结构

```text
src/
├── main.ts                       # 全局管道、过滤器、CORS、Swagger、静态资源
├── app.module.ts
├── common/
│   ├── database/                 # SQLite 连接、迁移
│   ├── dto/                      # 通用分页 DTO
│   ├── http/                     # 统一响应、异常过滤器
│   └── utils/
├── config/configuration.ts       # 环境变量读取与校验
├── health/                       # GET /api/health
├── media/                        # 上传、媒体库、文件头校验
├── panel/                        # /panel 调试面板
├── presets/                      # 预设内容包与分类 CRUD
├── public/index.html
├── data/app.db                   # 运行时生成，不提交
└── data/uploads/                 # 运行时生成，不提交
```

## API

### 预设内容包

预设 = 行业分类 + 内容包。内容包不再绑定 Elementor 组件字段，`content` 直接保存文本与图片素材的 JSON 集合。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/presets/list` | 分页与过滤：`page`、`page_size`、`keyword`、`category`、`enabled` |
| `POST` | `/api/presets/add` | 新建内容包 |
| `POST` | `/api/presets/update` | 更新内容包，`id` 可放在 body 或 query |
| `POST` | `/api/presets/delete` | 删除内容包，`id` 可放在 body 或 query |
| `GET` | `/api/presets/categories` | 分类列表 |
| `POST` | `/api/presets/categories/add` | 新建分类，`key` 可省略并自动生成 |
| `POST` | `/api/presets/categories/update` | 更新分类，`key` 可放在 body 或 query |
| `POST` | `/api/presets/categories/delete` | 删除分类，分类下仍有内容包时返回 `400` |

新建示例：

```json
{
  "category": "common",
  "name": "通用首页",
  "description": "不区分行业的通用素材",
  "content": {
    "texts": [
      { "title": "主标题", "content": "把复杂留给我们，把简单交给你" }
    ],
    "images": [
      { "name": "主视觉", "url": "/seed/home1.svg" }
    ]
  },
  "sort": 10,
  "enabled": true
}
```

内容规则：

- `category` 必须是已存在的分类 key
- `content.texts` 与 `content.images` 至少一项包含有效内容
- 图片 URL 支持 `http(s)://` 或以 `/` 开头的站内路径
- 同一分类下内容包名称唯一（`category + name`）

分类示例：

```json
{
  "key": "common",
  "name": "通用",
  "description": "不区分行业的通用素材",
  "sort": 10
}
```

### 媒体

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/media/upload` | `multipart/form-data`，字段名 `file` |
| `GET` | `/api/media/list` | 分页与关键字查询 |
| `GET` | `/api/media/:id` | 媒体详情 |
| `DELETE` | `/api/media/:id` | 删除记录与磁盘文件 |
| `GET` | `/uploads/*` | 访问已上传图片 |
| `GET` | `/seed/*.svg` | 访问内置示例图片 |

上传安全策略：

- 先由 Multer 限制文件大小，再校验扩展名、声明 MIME 和文件头
- 支持 JPEG、PNG、GIF、WebP、BMP、AVIF
- 默认不开放 SVG；即使通过环境变量开放，也应在上层增加内容清洗
- 上传文件使用随机文件名和 `wx` 排他写入，避免覆盖已有文件
- 图片本体保存在 `UPLOAD_DIR`；数据库只保存图片 URL 和媒体元数据
- 删除时校验磁盘路径只能位于 `UPLOAD_DIR` 内
- 图片仍被预设内容包引用时返回 `409`，避免产生失效资源

### 健康检查

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 检查服务和 SQLite 连接 |

## 数据库

数据库初始化由 `DatabaseService` 管理：

- `schema_migrations` 记录已执行迁移版本
- 当前迁移创建 `presets`、`preset_categories`、`media` 表，索引为 `category + name`
- 已存在的数据目录和表不会被删除
- 应用关闭时主动关闭 SQLite 连接

数据库和上传目录均属于运行时数据，不纳入 Git。

## 验证

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e
```

e2e 测试使用 `.e2e-runtime/` 下的临时数据库和上传目录，结束后自动清理，不会修改 `src/data/app.db`。

## 部署说明

- 生产环境建议使用绝对路径配置 `DB_FILE` 和 `UPLOAD_DIR`
- 通过 nginx 或反向代理统一转发 `/api/*`、`/uploads/*`、`/docs` 和 `/panel`
- 当前项目没有内置登录鉴权；如暴露到公网，应在反向代理层增加认证、限流和来源限制
- 生产环境建议设置明确的 `CORS_ORIGINS`，并视需要关闭 `PANEL_ENABLED`
- SQLite 适合单实例部署；多实例或多写场景应迁移到独立数据库服务

## 与现有前端的关系

本项目的调试面板和预设接口使用 `/api/presets/*`。`material_collect_system` 的预设内容页与页面编辑素材弹窗通过 `VITE_PRESET_API_BASE_URL` 接入这些接口。媒体客户端仍使用 `/api/media/save`、`/api/media/get`、`/api/media/delete`，与本项目当前 `/api/media/upload|list|:id` 路由不同；接入前需要在客户端做路由映射，或在后端增加兼容适配层。
