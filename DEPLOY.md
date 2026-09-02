# 日常集 · 生活工作台 部署文档

## 一、项目概述

集成式生活工作台，包含七大模块：今日概览、记账理财、习惯健康、减脂健身、日程统筹、待买清单、书影收藏。数据全部存储于飞书多维表格，页面读写直连线上数据，跨设备数据一致。

### 技术栈

| 技术 | 版本 | 用途 |
|---|---|---|
| Next.js | 14.2.5 | 全栈框架（App Router） |
| React | 18.3.1 | UI 库 |
| TypeScript | 5.5.3 | 类型安全 |
| Tailwind CSS | 3.4.6 | 样式 |
| Recharts | 2.12.7 | 图表（饼图/柱图/折线图） |
| lucide-react | 0.408.0 | 图标 |
| 飞书多维表格 API | — | 数据存储 |

### 项目结构

```
├── app/
│   ├── layout.tsx              # 根布局（导航 + 无障碍面板 + 字体）
│   ├── page.tsx                # 今日概览（聚合各模块）
│   ├── finance/page.tsx        # 记账理财
│   ├── habit/page.tsx          # 习惯健康
│   ├── fitness/page.tsx        # 减脂健身
│   ├── schedule/page.tsx       # 日程统筹
│   ├── shopping/page.tsx       # 待买清单
│   ├── collection/page.tsx     # 书影收藏
│   ├── api/feishu/route.ts     # 飞书 API 代理（保护密钥）
│   └── globals.css             # 全局样式 + 无障碍样式
├── components/
│   ├── Nav.tsx                 # 导航（桌面侧边栏 + 移动底部栏）
│   ├── Toast.tsx               # 全局提示
│   ├── Skeleton.tsx            # 骨架屏
│   ├── EmptyState.tsx          # 空状态
│   ├── RetryError.tsx          # 错误重试
│   └── AccessibilityPanel.tsx  # 无障碍设置面板
├── lib/
│   ├── feishu.ts               # 飞书 SDK 封装
│   ├── api-client.ts           # 前端 API 客户端
│   ├── hooks.ts                # useAsync 数据加载 Hook
│   └── utils.ts                # 工具函数
├── .env.local                  # 环境变量（不提交）
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 二、环境要求

- **Node.js** >= 18.17（推荐 20.x 或更高）
- **npm** >= 9.x
- 操作系统：Windows / macOS / Linux 均可

---

## 三、飞书多维表格配置

### 3.1 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)，登录后进入「开发者后台」
2. 点击「创建企业自建应用」
3. 填写应用名称（如「生活工作台」）和描述
4. 在「权限管理」中开通以下权限：
   - `bitable:app` — 多维表格读写
   - `bitable:app:readonly` — 多维表格只读（如只需读取）
5. 在「凭证与基础信息」页面获取：
   - **App ID**（形如 `cli_xxxxxxxx`）
   - **App Secret**

### 3.2 创建多维表格

1. 在飞书中新建一个多维表格（Base）
2. 从多维表格 URL 中获取 **Base Token**：
   ```
   https://xxx.feishu.cn/base/VBWKbLEzgaKCqfsWTDncsfbcnhh
                                    ────────────────────────
                                    这段就是 Base Token
   ```

### 3.3 创建数据表

在同一个多维表格中创建以下 7 张数据表，字段定义如下：

#### 表 1：记账理财（FINANCE）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 日期 | 日期 | |
| 类型 | 单选 | 支出 / 收入 |
| 金额 | 数字 | |
| 分类 | 单选 | 餐饮/交通/购物/娱乐/医疗/教育/住房/工资/理财/其他 |
| 备注 | 多行文本 | |

#### 表 2：习惯定义（HABIT）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 名称 | 多行文本 | |
| 类型 | 单选 | 勾选 / 计数 / 数值 |
| 目标值 | 数字 | 计数/数值方式的目标 |
| 单位 | 多行文本 | 如"杯""分钟" |
| 颜色 | 多行文本 | 颜色标签 |
| 是否激活 | 复选框 | |
| 创建日期 | 日期 | |

#### 表 3：习惯打卡（HABIT_LOG）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 习惯ID | 多行文本 | 关联习惯定义的 record_id |
| 习惯名称 | 多行文本 | 冗余便于展示 |
| 日期 | 日期 | |
| 值 | 数字 | 勾选=1/0，计数=次数，数值=实际值 |

#### 表 4：减脂健身（FITNESS）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 日期 | 日期 | |
| 体重 | 数字 | kg |
| 体脂率 | 数字 | % |
| 热量摄入 | 数字 | kcal |
| 热量消耗 | 数字 | kcal |
| 备注 | 多行文本 | |

#### 表 5：日程统筹（SCHEDULE）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 日期时间 | 日期 | 含时间 |
| 标题 | 多行文本 | |
| 描述 | 多行文本 | |
| 类型 | 单选 | 工作/生活/健康/其他 |
| 是否完成 | 复选框 | |

#### 表 6：待买清单（SHOPPING）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 名称 | 多行文本 | |
| 数量 | 数字 | |
| 预估价格 | 数字 | |
| 分类 | 单选 | 食物/日用/电子/衣物/其他 |
| 是否购买 | 复选框 | |
| 链接 | 链接 | |

#### 表 7：书影收藏（COLLECTION）

| 字段名 | 类型 | 说明 |
|---|---|---|
| 标题 | 多行文本 | |
| 类型 | 单选 | 书籍/电影/剧集/音乐 |
| 状态 | 单选 | 想看/在看/看过 |
| 星级 | 数字 | 1-5 |
| 短评 | 多行文本 | |
| 封面 | 链接 | |
| 完成日期 | 日期 | |

### 3.4 获取 Table ID

每张数据表打开后，从 URL 末尾获取 Table ID：
```
https://xxx.feishu.cn/base/.../table=tbleVYKVI2E64zqa
                                  ──────────────────
                                  这段就是 Table ID
```

### 3.5 授权应用访问多维表格

1. 打开多维表格
2. 点击右上角「+」协作者按钮
3. 搜索你的应用名称或 App ID
4. 添加为「可编辑」协作者

> **重要**：如果不授权，API 会返回 `RolePermNotAllow` 错误。

---

## 四、环境变量

### 4.1 变量列表

| 变量名 | 说明 | 示例 |
|---|---|---|
| `FEISHU_APP_ID` | 飞书应用 App ID | `cli_aa1fe886a9b95bcd` |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret | `sA1CfXyRv2mifQ3Q...` |
| `FEISHU_BASE_TOKEN` | 多维表格 Base Token | `VBWKbLEzgaKCqfsWTDncsfbcnhh` |
| `FEISHU_TABLE_FINANCE` | 记账理财表 ID | `tbleVYKVI2E64zqa` |
| `FEISHU_TABLE_HABIT` | 习惯定义表 ID | `tblP6c2WCrRiRtVZ` |
| `FEISHU_TABLE_HABIT_LOG` | 习惯打卡表 ID | `tblirf1DNl4rQdxF` |
| `FEISHU_TABLE_FITNESS` | 减脂健身表 ID | `tblKpLKUVzu1uuQ0` |
| `FEISHU_TABLE_SCHEDULE` | 日程统筹表 ID | `tblyjznQ8EHaZNz9` |
| `FEISHU_TABLE_SHOPPING` | 待买清单表 ID | `tblv41FUsGLeBiU7` |
| `FEISHU_TABLE_COLLECTION` | 书影收藏表 ID | `tblj16zxEZET8nQ9` |

### 4.2 本地配置

在项目根目录创建 `.env.local` 文件：

```bash
FEISHU_APP_ID=你的AppID
FEISHU_APP_SECRET=你的AppSecret
FEISHU_BASE_TOKEN=你的BaseToken
FEISHU_TABLE_FINANCE=tbl...
FEISHU_TABLE_HABIT=tbl...
FEISHU_TABLE_HABIT_LOG=tbl...
FEISHU_TABLE_FITNESS=tbl...
FEISHU_TABLE_SCHEDULE=tbl...
FEISHU_TABLE_SHOPPING=tbl...
FEISHU_TABLE_COLLECTION=tbl...
```

> `.env.local` 已在 `.gitignore` 中，不会提交到代码仓库。

---

## 五、本地开发

### 5.1 安装依赖

```bash
npm install
```

### 5.2 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 5.3 构建生产版本

```bash
npm run build
```

### 5.4 启动生产服务器

```bash
npm run start
```

### 5.5 代码检查

```bash
npm run lint
```

---

## 六、Vercel 部署

### 6.1 准备代码仓库

1. 将项目代码推送到 GitHub（或其他 Git 平台）
2. 确认 `.env.local` 不会被提交（已在 `.gitignore` 中）

### 6.2 导入项目

1. 访问 [Vercel](https://vercel.com/)，使用 GitHub 账号登录
2. 点击「Add New Project」
3. 选择你的代码仓库
4. Framework Preset 选择 **Next.js**（通常会自动识别）
5. 其他设置保持默认，点击「Deploy」

### 6.3 配置环境变量

1. 部署完成后，进入项目 Settings → Environment Variables
2. 逐一添加第四节中列出的所有环境变量
3. 添加完成后，点击「Redeploy」重新部署

> **重要**：环境变量配置后必须重新部署才能生效。

### 6.4 验证部署

1. 访问 Vercel 分配的域名（如 `https://your-app.vercel.app`）
2. 检查各模块是否能正常加载数据
3. 尝试新增一条记录，确认数据写回飞书成功

%3. 换设备/浏览器访问，确认数据一致

---

## 七、Docker 部署（可选）

### 7.1 创建 Dockerfile

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### 7.2 构建与运行

```bash
docker build -t life-workbench .
docker run -p 3000:3000 \
  -e FEISHU_APP_ID=xxx \
  -e FEISHU_APP_SECRET=xxx \
  -e FEISHU_BASE_TOKEN=xxx \
  -e FEISHU_TABLE_FINANCE=xxx \
  -e FEISHU_TABLE_HABIT=xxx \
  -e FEISHU_TABLE_HABIT_LOG=xxx \
  -e FEISHU_TABLE_FITNESS=xxx \
  -e FEISHU_TABLE_SCHEDULE=xxx \
  -e FEISHU_TABLE_SHOPPING=xxx \
  -e FEISHU_TABLE_COLLECTION=xxx \
  life-workbench
```

---

## 八、功能说明

### 8.1 七大模块

| 模块 | 路由 | 功能 |
|---|---|---|
| 今日概览 | `/` | 实时时钟、时段问候语、每日一句、各模块数据聚合卡片 |
| 记账理财 | `/finance` | 收支 CRUD、快速记账、预算进度、日均.日均线、消费结构饼图、近 6 月对比柱图、分类筛选 |
| 习惯健康 | `/habit` | 增删习惯、勾选/计数/数值三种打卡、30 天热力图、连续打卡天数 |
| 减脂健身 | `/fitness` | 体重体脂记录、7 日均线、BMI、目标进度、热量缺口、体重变化提示、自定义周计划 |
| 日程统筹 | `/schedule` | 日程 CRUD、完成勾选、按日分组、分类标签、完成率进度条 |
| 待买清单 | `/shopping` | CRUD、已购勾选、分类、预估总额、链接 |
| 书影收藏 | `/collection` | 状态/星级/短评、封面墙与列表双视图、年度统计、搜索、平均评分 |

### 8.2 无障碍功能

- **字体大小调节**：小/标准/大/特大四档
- **高对比度模式**：黑底白字
- **减少动画**：关闭所有过渡动画
- **键盘导航**：Skip link 跳转主内容
- **焦点环可见**：所有可交互元素键盘聚焦时显示轮廓
- **ARIA 标签**：导航、按钮均有语义化标注，支持屏幕阅读器

### 8.3 视觉设计

- **配色**：大地色系（墨色 ink / 陶色 clay / 鼠尾草绿 sage）
- **字体**：正文用霞鹜文楷（LXGW WenKai），标题用思源宋体（Noto Serif SC）
- **响应式**：桌面左侧边栏导航，移动端底部 tab bar

---

## 九、常见问题

### Q1: 页面显示「数据加载失败」

**原因**：飞书凭证未配置或应用无权限访问多维表格。

**解决**：
1. 检查 `.env.local` 或 Vercel 环境变量是否填写完整
2. 确认飞书应用已被添加为多维表格的协作者
3. 确认所有数据表都在同一个多维表格（Base）中

### Q2: API 返回 `RolePermNotAllow`

**原因**：飞书应用未被授权访问对应的数据表。

**解决**：在多维表格中把应用添加为「可编辑」协作者（见 3.5 节）。

### Q3: API 返回 `TextFieldConvFail` / `URLFieldConvFail`

**原因**：飞书表字段类型与代码不匹配。

**解决**：对照 3.3 节的字段定义，确认每张表的字段名称和类型正确。

### Q4: 新增记录后列表不刷新

**原因**：可能是飞书 API 响应延迟。

**解决**：页面会自动重新拉取数据，如仍未刷新，手动刷新页面。

### Q5: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**原因**：dev server 端口被占用，前端访问到了错误的地址。

**解决**：
1. 关闭残留的 Node 进程
2. 删除 `.next` 目录后重新 `npm run dev`

### Q6: 构建时出现 `PageNotFoundError`

**原因**：Windows 中文路径下的间歇性问题。

**解决**：删除 `.next` 目录后重新构建。

---

## 十、维护与更新

### 更新飞书凭证

如需更换飞书应用或多维表格：
1. 修改 `.env.local`（本地）或 Vercel 环境变量（线上）
2. 重启 dev server 或重新部署

### 添加新数据表

1. 在飞书多维表格中新建数据表
2. 在 `lib/api-client.ts` 的 `TableName` 类型中添加表名
3. 在 `app/api/feishu/route.ts` 的 `TABLE_KEY_MAP` 中添加映射
4. 在 `.env.local` 中添加对应的 Table ID

### 字体更换

修改 `app/layout.tsx` 中的 `<link>` 标签和 `tailwind.config.ts` 中的 `fontFamily`。
