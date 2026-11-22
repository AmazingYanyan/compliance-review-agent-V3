# 合规审查智能体 V3

合规审查智能体的工程起点。本轮交付范围：**登录、注册，以及用于验证认证链路的极简 `/dashboard`**。

- 前端：`frontend/` — 基于上游 [art-design-pro](https://github.com/Daymychen/art-design-pro)（Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS）
- 后端：`backend/` — FastAPI + Pydantic v2 + SQLAlchemy 2.x async + Alembic + PostgreSQL 18 + Argon2
- 队列：Procrastinate（与业务库同一个 PostgreSQL）

> 上游源码以原始提交 `f3aaf58eec1a0e988f162352c33862327a484f95` 导入，许可证与版权声明保留在 `frontend/LICENSE`。
> 详见 [DECISIONS.md](DECISIONS.md) 与 [HANDOFF.md](HANDOFF.md)。

## 快速开始

（本文件在实现完成后补充完整启动、Compose、迁移、测试与开发账号说明。）

## 目录结构

```
.
├── frontend/          # ADP 前端（上游基线 + 本轮改造）
├── backend/           # FastAPI 后端
├── docs/screenshots/  # 浏览器验收截图
├── docker-compose.yml # PostgreSQL 18 + backend + worker (+ frontend)
├── .env.example       # 环境变量样例
├── HANDOFF.md         # 交接说明（≤ 50 行）
├── DECISIONS.md       # 关键实现取舍
└── TEST_TODO.md       # 待补充的测试场景
```
