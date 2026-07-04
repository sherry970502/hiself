# HiSelf · 遇见更好的自己

> Hi, self! —— 你 + AI 的结合体。以你的人格（观点、方法论、立场、表达风格）为不变量，以 AI 的知识与能力为增量。对内是你的第二大脑，对外是一个开链即聊、讲你那套方法论比你还清楚的公开分身。

## 功能

- **喂养管道** `/feed`：批量上传 .md/.txt/.docx/.pdf 或粘贴文本 → AI 自动切分、分型打标（观点V/方法论M/事实F/偏好P/风格S）、隐私初判 → 入库
- **Owner 对话** `/chat`：语音优先（Web Speech API），你说的观点自动沉淀进人格层（可撤销）；分身会把待访谈队列里的问题自然地问你
- **第二大脑查询**：问它「我对 X 的看法是什么」，回答引用条目并标注出处
- **记忆管理** `/memory`：分型浏览/搜索/编辑/公开私密切换、待访谈队列、留言收件箱、访客会话日志、一键全量导出（JSON/Markdown）
- **公开看板** `/board`：访客开链即聊。你讲过的，它用你的立场展开讲得更好；没讲过的，得体拒绝并自动进待访谈队列（增长飞轮）；支持留言转达
- **设置** `/settings`：部署后在界面里配置 Anthropic API Key，即时生效；未配置时全流程 Mock 模式可演示

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:3000/login，默认口令 `owner123`。

## 部署（Docker）

```bash
docker build -t hiself .
docker run -d -p 3000:3000 -v hiself-data:/data -e OWNER_TOKEN=换成你的口令 hiself
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `OWNER_TOKEN` | Owner 登录口令（默认 `owner123`，上线务必修改） |
| `ANTHROPIC_API_KEY` | 可选；也可以部署后在 `/settings` 页面配置 |
| `DB_PATH` | SQLite 路径（Docker 中默认 `/data/ai-avatar.db`，挂持久卷防止数据丢失） |

## 技术栈

Next.js 16 · better-sqlite3 · Anthropic SDK（claude-sonnet-4-6）· Tailwind CSS 4 · Web Speech API
