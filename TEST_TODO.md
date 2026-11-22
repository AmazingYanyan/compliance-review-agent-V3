# TEST TODO

本轮已覆盖的场景见 `backend/tests/`（13 个用例，全部通过）。以下场景留待后续迭代补充。

## 已覆盖

- [x] 注册成功（HTTP 201 / 业务 code 200）、重复邮箱（409）、参数校验错误（422）
- [x] 登录成功（accessToken + refresh Cookie）、密码错误（401）
- [x] 未授权访问 `/api/v1/user/info`（401）、带 token 正常返回
- [x] 刷新轮换 refresh token 后旧 token 失效（401）
- [x] 退出后当前 refresh token 失效（401）、退出可重复调用
- [x] Cookie 写请求的来源校验（不可信 Origin → 403）
- [x] 欢迎任务投递失败时注册整体回滚（另一条连接断言用户不存在）
- [x] 正常注册落库且欢迎任务进入队列
- [x] `/health` 服务与数据库状态

## 认证 / 会话

- [ ] 并发请求同时触发 401 时，确认只发生一次 refresh，且每个原请求最多重试一次（需补并发测试）。
- [ ] access token 过期后使用 refresh cookie 恢复会话的端到端场景（需构造过期 token）。
- [ ] refresh token 轮换后，旧 refresh token 重复使用的幂等/拒绝行为（当前仅覆盖「旧 token 失效」）。
- [ ] 退出后旧 access token 在有效期内仍可访问 `/api/v1/user/info` 的显式回归测试。
- [ ] Cookie `SameSite=None` + `Secure` 的跨站部署形态验证。
- [ ] 登录失败次数限流 / 账号锁定策略。

## 注册

- [ ] 并发注册同一邮箱时，唯一约束冲突（409）的实际并发表现。
- [ ] 显示名长度上限、包含空白字符的显示名等边界值。
- [ ] 密码强度规则（大小写 / 数字 / 特殊字符）收紧后的用例。
- [ ] `REGISTRATION_ENABLED=false` 时前端入口隐藏与后端 403 的联动。

## 队列

- [ ] worker 崩溃重启后的任务重试与死信处理。
- [ ] 任务幂等性（同一用户重复投递 welcome 任务）。
- [ ] 队列积压时的 worker 并发调优。
- [ ] Procrastinate 版本升级后官方迁移脚本的应用流程。

## 前端

- [ ] 键盘全流程走查（Tab 顺序、Enter 提交、Esc 关闭提示）。
- [ ] `prefers-reduced-motion` 下回弹动效关闭的自动化断言。
- [ ] 弱网 / 慢接口下的 loading 与超时提示。
- [ ] 多标签页同时登录 / 退出的状态同步。
- [ ] 前端组件测试（Vitest）与端到端测试（Playwright）基建。

## 业务（本轮之外）

- [ ] 合规审查任务本身的权限矩阵与审计留痕。

