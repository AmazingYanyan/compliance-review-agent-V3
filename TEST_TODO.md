# TEST TODO

后端已覆盖的场景见 `backend/tests/`（15 个用例，全部通过）。以下场景留待后续迭代补充。

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
- [x] `GET /api/v1/auth/config` 返回注册开关状态（默认开放）
- [x] `REGISTRATION_ENABLED=false` 时注册接口返回 403，且 config 同步返回关闭

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
- [x] `REGISTRATION_ENABLED=false` 时前端入口隐藏与后端 403 的联动
      （前端：`useAuthStore.registrationEnabled` 控制登录页入口隐藏 + 守卫拦截注册路由；
      后端：register 403；浏览器手动复验待补 `REGISTRATION_ENABLED=false` 环境的实跑截图）。

## 队列

- [ ] worker 崩溃重启后的任务重试与死信处理。
- [ ] 任务幂等性（同一用户重复投递 welcome 任务）。
- [ ] 队列积压时的 worker 并发调优。
- [ ] Procrastinate 版本升级后官方迁移脚本的应用流程。

## 我的任务（CP7）

代码已实现，`vue-tsc --noEmit` 与 `pnpm build` 均通过；浏览器逐项验收已完成（Chrome 1440px / 390px 实跑）。

### 已验收

- [x] 登录后侧栏出现「我的任务」，点击进入列表页。
- [x] 未登录直接访问 `/tasks` 与 `/tasks/:taskId/workbench`，被守卫引导到登录页（`/auth/login?redirect=...`）。
- [x] 新建任务：企业名称与客户类型必填校验、取消不新增、连续点击不重复创建。
      —— **验收中发现缺陷并已修复**：原实现把 `submitting` 锁放在 `await validate()` 之后，连击两次会创建两条任务；
      已改为「先上锁再校验」（`task-create-dialog.vue` 的 `handleSubmit`）。
- [x] 新建后列表顶部立即出现该任务；刷新列表后仍在（sessionStorage 持久化）。
- [x] 新任务状态为「待核对」，无材料时工作台显示「尚未上传公司章程」+「该任务尚未上传任何材料」。
- [x] 三种状态分别显示「开始 / 继续核对 / 查看」，点击进入同一工作台组件。
- [x] 「继续核对」样例任务：同一内容区可切换「公司章程」与「财务报表」，当前材料有选中态（同一时刻仅 1 个面板可见）。
- [x] 已完成任务进入工作台为只读态（带「只读」标签，只提供材料切换与「返回我的任务」）。
- [x] 未知任务 ID 显示「任务不存在」提示与返回列表入口。
- [x] 企业名称子串搜索（忽略首尾空格，`"  华信  "` → 命中「华信资本管理有限公司」）、四个状态筛选、组合查询、重置。
- [x] 无结果时显示「未找到符合条件的任务」+ 重置筛选入口；无任务时显示「暂无任务」+ 新建入口。
- [x] 当前筛选会隐藏新任务时，创建后自动清除筛选并提示「已清除筛选条件，可直接查看新任务」。
- [x] 从工作台返回列表后，搜索词与状态筛选恢复，列表结果一致。
- [x] 刷新工作台页面后返回列表，筛选条件仍在（sessionStorage 持久化）。
- [x] 切换任务后顶部标签页标题与页面内容都更新为当前任务（标签标题显示企业名称），不残留上一条信息。
- [x] 1440px 与 390px 检查：侧栏、列表、创建表单、工作台、返回入口；窄屏无横向溢出
      （`documentElement.scrollWidth == clientWidth`，表格自身横向滚动）。
- [x] 关键路径控制台无新增错误，网络请求无意外失败（`Runtime.consoleAPICalled` / `Log.entryAdded` / `Network.loadingFailed` 均无记录）。
- [x] 截图存入 `docs/screenshots/`：`cp7-{task-list,task-create,workbench-no-charter,workbench-multi-material,workbench-unknown-id,workbench-completed-readonly}-{desktop,narrow}.png`（共 12 张）。
- [x] 键盘：Tab 顺序（企业名称 → 任务状态 → 重置 → 查询 → 新建任务 → 表格工具 → 行内操作），
      焦点有可见轮廓；`Esc` 可关闭新建任务弹窗。

### 未覆盖 / 已知限制

- [ ] 输入框内按 `Enter` 直接提交新建任务表单（当前需点「创建」按钮）。
- [ ] 窄屏下侧栏展开态截图（仅验证了默认收起态与无横向溢出）。

### 后续迭代（接后端后）

- [ ] 真实任务接口的分页、排序、错误提示与重试。
- [ ] 人工核对决定的保存：原文 / 摘录 / 出处 / 接受或拒绝（拒绝需填原因）。
- [ ] 状态流转 `pending → in_review → completed` 的端到端用例。
- [ ] 任务权限矩阵与双账号隔离（同标签页内不同账号的任务可见范围）。
- [ ] 材料上传、OCR 处理中 / 缺材料 / 提取失败 / 覆盖不全等工作台内部状态的展示。
- [ ] sessionStorage 容量上限触发后的降级策略。

## 前端

- [ ] 键盘全流程走查（Tab 顺序、Enter 提交、Esc 关闭提示）。
- [ ] `prefers-reduced-motion` 下回弹动效关闭的自动化断言。
- [ ] 弱网 / 慢接口下的 loading 与超时提示。
- [ ] 多标签页同时登录 / 退出的状态同步。
- [ ] 前端组件测试（Vitest）与端到端测试（Playwright）基建。
- [ ] 侧栏多级菜单与面包屑的自动化断言（当前「我的任务」为单级菜单，工作台走 `activePath` 高亮）。



