# 客户菜单权限接口（待实现）

本文档用于补齐 `material_collec_system` 客户端「客户权限」面板所需的接口。

## 背景

- 客户端侧边栏需要按权限展示功能页面。
- 权限**全站共用一份**，不区分客户、不区分站点。
- 管理员在后台「客户权限」页面统一开关，客户刷新后生效。
- 当前前端已按以下接口接入；后端未实现前，前端会提示接口未就绪。

## 统一响应格式

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

成功时 HTTP 状态码为 `200`；参数错误、资源不存在和服务器错误返回真实 HTTP 状态码，同时保持相同响应结构（此时 `code` 为 HTTP 状态码）。

## 权限字段

权限对象为扁平布尔映射，键为菜单标识，值为是否允许客户访问：

```json
{
  "instruction": true,
  "customerInfo": false,
  "bannerCollection": false,
  "siteInfo": true,
  "pages": true,
  "productList": false,
  "newsList": false
}
```

| 菜单标识 | 页面 | 默认值 |
| --- | --- | --- |
| `instruction` | 教程页 | `true` |
| `customerInfo` | 客户基础信息 | `false` |
| `bannerCollection` | Banner 收集 | `false` |
| `siteInfo` | 网站信息 | `true` |
| `pages` | 页面列表 | `true` |
| `productList` | 产品列表 | `false` |
| `newsList` | 新闻列表 | `false` |

约定：

- 未返回的键由前端补默认值，不视为错误。
- 新增菜单时只追加键，不影响旧配置。
- `admin` 角色不受这些开关限制。

## 1. 获取菜单权限

```http
GET /api/user/menu_permissions
```

### 请求参数

无。

### 响应示例

```json
{
  "code": 0,
  "data": {
    "permissions": {
      "instruction": true,
      "customerInfo": false,
      "bannerCollection": false,
      "siteInfo": true,
      "pages": true,
      "productList": false,
      "newsList": false
    },
    "updated_at": "2026-11-11T10:00:00.000Z"
  },
  "message": "success"
}
```

### 说明

- 已登录用户均可读取，客户端登录后需要调用。
- 首次没有任何配置时，建议直接返回全部默认值，而不是 `404`。
- `updated_at` 可选，用于排查配置是否生效。

## 2. 保存菜单权限

```http
POST /api/user/set_menu_permissions
Content-Type: application/json
```

### 请求体

```json
{
  "permissions": {
    "instruction": true,
    "customerInfo": true,
    "bannerCollection": true,
    "siteInfo": true,
    "pages": true,
    "productList": false,
    "newsList": false
  }
}
```

### 响应示例

```json
{
  "code": 0,
  "data": {
    "permissions": {
      "instruction": true,
      "customerInfo": true,
      "bannerCollection": true,
      "siteInfo": true,
      "pages": true,
      "productList": false,
      "newsList": false
    },
    "updated_at": "2026-11-11T10:05:00.000Z"
  },
  "message": "保存成功"
}
```

### 校验规则

- 仅 `admin` 角色可调用，其它角色返回 `403`。
- `permissions` 必须是对象，值必须是布尔值；非法键可以忽略或返回 `400`。
- 建议按已知菜单键做白名单过滤，避免把任意键写入配置。
- 推荐整份覆盖保存，不做增量合并。

## 存储建议

推荐新建一张单行配置表，而不是复用页面/站点数据：

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT
);

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('customer_menu_permissions', '{}', NULL);
```

`value` 保存权限对象的 JSON 字符串。读取时解析，解析失败按默认值处理并记录日志。

## 前端接入

前端已在以下位置调用这两个接口：

- `src/apis/user.js`：`getMenuPermissions()`、`setMenuPermissions(payload)`
- `src/apis/collection.js`：`loadCustomerMenuPermissions()`、`saveCustomerMenuPermissions(permissions)`
- 登录成功后和刷新页面时自动拉取权限。
- 路由守卫与侧边栏共用同一份判断，直接输入地址也会被拦截。

接口尚未实现时：

- `GET` 返回非 `0`，后台面板会提示「权限接口未就绪」。
- `POST` 返回非 `0`，保存失败并保留当前改动。

## 验收清单

- [ ] 管理员打开「客户权限」，能读到当前配置。
- [ ] 关闭「客户基础信息」「Banner 收集」后保存成功。
- [ ] 客户重新登录或刷新后，侧边栏不再出现这两项。
- [ ] 客户直接访问 `/#/customerInfo`、`/#/bannerCollection` 会被拦截。
- [ ] 普通客户调用保存接口返回 `403`。
- [ ] 多次保存不会产生重复配置行。
