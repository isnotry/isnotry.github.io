# kingsir.blog — Markdown 博客框架设计（Jekyll 驱动）

> 目标：基于 GitHub Pages 的个人站点，分「博客文章」与「GitHub 项目」两部分，文章用 Markdown 书写，排版走极简克制风（浅色为主、暖黄强调、克制留白）。
> 已采用 **路线 B（Jekyll 驱动）**：只写 Markdown，GitHub Pages 自动编译发布。

---

## 1. 视觉风格

| 维度 | 取值 / 思路 |
| --- | --- |
| 整体气质 | 浅色为主、大量留白、卡片化、暖黄强调色（#f5b400） |
| 字体 | 系统无衬线 + PingFang SC（中文）；代码用等宽 |
| 导航 | 顶部吸顶窄栏，毛玻璃模糊，左侧品牌点 + 右侧链接 / 主题切换 |
| 首页 | Hero 一句话自我介绍 → 「最新文章」卡片网格 → 「我的项目」卡片网格 |
| 文章页 | 居中阅读栏（≤720px）+ 右侧粘性目录(TOC，由 JS 按标题自动生成) |
| 主题 | 内置浅色 / 深色，localStorage 记忆，默认浅色 |
| 封面 | 离线渐变占位（cv-a~cv-f），无需外部图片即可预览 |

---

## 2. 目录结构（Jekyll，已落地）

```
pages/
├── _config.yml            # 站点配置：title / permalink / 插件 / defaults
├── Gemfile                # GitHub Pages 构建依赖（jekyll + jekyll-feed）
├── index.html             # 首页：Hero + 博客列表 + 项目网格（Liquid 模板）
├── about.md               # 关于页（layout: default，permalink: /about/）
├── _layouts/
│   ├── default.html       # 全站骨架：head + header + footer + 脚本
│   └── post.html          # 文章页布局：封面 / 标题 / TOC / 上下篇导航
├── _includes/
│   ├── head.html          # <head> + meta + favicon + RSS
│   ├── header.html        # 顶部导航 + GitHub 图标 + 主题切换
│   ├── footer.html        # 页脚
│   ├── post-card.html     # 文章卡片（接收 post 变量）
│   └── project-card.html  # 项目卡片（接收 project 变量）
├── _posts/                # Markdown 文章（YYYY-MM-DD-slug.md，当前为空 —— 示例文已清空）
├── _data/
│   └── projects.yml       # 项目数据（手写维护，对应 github.com/isnotry 的仓库）
├── assets/
│   ├── css/style.css      # 设计系统（变量 / 组件 / 响应式 / 暗色）
│   └── js/main.js         # 主题切换 + TOC 生成/高亮 + 导航高亮
├── tools/
│   └── preview.mjs        # 零 Ruby 依赖的本地预览生成器（见 §5）
└── DESIGN.md
```

> 推到 GitHub Pages 时，`_site/`、`tools/`、`Gemfile`、`DESIGN.md` 已被 `_config.yml` 的 `exclude` 排除，不会进站点。
> `.backup/`（已清空的示例文章备份）以 `.` 开头，Jekyll 默认忽略，且已写进 `.gitignore`。

---

## 3. Markdown 文章规范（Front Matter）

每篇文章一个 `.md`，文件名 `YYYY-MM-DD-slug.md`，头部用 YAML 描述元信息：

```yaml
---
title: 文章标题
date: 2026-08-11
category: 教程          # 卡片上的小标（教程 / 效率 / 前端 …）
tags: [教程, 前端, GitHub]
cover: cv-a             # 封面渐变：cv-a ~ cv-f
emoji: "📝"            # 封面表情
excerpt: 列表页摘要（1~2 句）
---
```

正文即标准 Markdown（标题 / 段落 / 列表 / 代码块 / 引用 / 表格均支持）。Jekyll（kramdown）会自动为标题加 `id`，配合 `assets/js/main.js` 自动生成右侧目录。

---

## 4. 页面组成

| 页面 | 作用 | 数据来源 |
| --- | --- | --- |
| `index.html` | 首页：自我介绍 + 最新文章 + 项目 | 文章读取 `site.posts`；项目读取 `site.data.projects`（手写 `projects.yml`） |
| `_layouts/post.html` | 单篇文章阅读页 | 由 `_posts/*.md` 自动渲染，含 TOC 与上一篇/下一篇 |
| `about.md` | 关于页 | 固定页面 |
| `_data/projects.yml` | 「我的项目」数据源 | 手动维护（已选方案：手写 YAML，零依赖） |

> 「项目」采用你确认的 **手写 `projects.yml`** 方案（最稳、零依赖）；后续若想实时同步 Star，可升级为构建前脚本拉 GitHub API 或前端 JS 拉取。

### 项目卡片字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` / `desc` | ✅ | 卡片标题与简介 |
| `url` | ✅ | GitHub 仓库地址（卡片标题链接） |
| `demo` | ➖ | 在线试用地址；**留空则不渲染「在线试用」按钮**（如需要自建服务的 WebNote） |
| `lang` / `lang_class` | ✅ | 语言名 + 圆点颜色 class（见 `style.css` 的 `.lang-*`） |
| `stars` | ➖ | 留空则不显示星标（避免 0 star 噪声） |
| `date` | ✅ | **排序用**，写带引号的 ISO 串（同天项目要带时分，否则倒序时顺序不稳定） |

首页渲染时固定按 `date` **从新到旧**：`{% assign projects = site.data.projects | sort: "date" | reverse %}` —— 新增项目时不用管写在 yml 的哪个位置。

---

## 5. 本地预览（无需 Ruby）

本机系统 Ruby 较旧、装 Jekyll 4.x 不稳，因此提供零依赖的 Node 预览生成器，复用同一套 Jekyll 模板：

```bash
cd pages
npm install --prefix tools marked js-yaml     # 仅首次
node tools/preview.mjs                        # 读取模板 → 输出 _site/
python3 -m http.server 8081 --directory _site --bind 127.0.0.1
# 打开 http://127.0.0.1:8081
```

`preview.mjs` 支持受限 Liquid 子集（`{{ }}`、`{% for %}`、`{% if/unless %}`、`{% include %}`、`{% assign %}`、`{% capture %}`、常用 filter），足以渲染本仓库模板；推到 GitHub 后由官方 Jekyll 接管，无需此文件。

> 两处已对齐真实 Liquid 语义的补充：数组的 `.size` / `.first` / `.last` 属性，以及 `>` `<` `>=` `<=` 数值比较 —— 首页「还没有文章」的空状态分支 `{% if site.posts.size > 0 %}` 依赖它。
> 注意 `{% if site.posts %}` 在真实 Liquid 里**空数组也算真**，所以判断文章数一律用 `.size > 0`。

---

## 6. 接入 GitHub Pages（路线 B，最终步骤）

1. 仓库：**已有的 `isnotry.github.io`**（用户名必须匹配；若用其它仓库名，改 `_config.yml` 的 `baseurl`）。
   站点源码在 **`docs/`** 子目录，`main` 分支，Pages 的 Source 保持 `main` + `/docs`。
   > 历史沿革：该仓库 `docs/` 原先放的是 `theme: minima` 的博客，由 mytoolbox（写字台）的「发布到 GitHub Pages」自动推送。
   > 该发布链路已于 2026-09-28 从 mytoolbox 整体移除，现在**唯一**的发布入口是本仓库的 `tools/deploy.sh`。
2. 发布（本目录不是 git 仓库，用临时 clone 推送）：
   ```bash
   bash tools/deploy.sh "提交说明"      # 本地构建 → rsync 到 docs/ → commit → push
   ```
   手写等价步骤：
   ```bash
   git clone git@github.com:isnotry/isnotry.github.io.git /tmp/isnotry-io
   cd /tmp/isnotry-io
   rm -rf docs
   rsync -a --exclude _site --exclude tools --exclude node_modules \
     /Users/kingsir/Documents/AI/projects/pages/ docs/
   git add -A && git commit -m "blog: 更新站点"
   git push origin main
   ```
3. 仓库 Settings → Pages → Build and deployment → Source 选 **Deploy from a branch**，分支 `main`、目录 **`/docs`**（保持现状即可）。
4. 等待约 1 分钟，访问 `https://isnotry.github.io`。
5. 写新文章：在 `_posts/` 新建 `YYYY-MM-DD-slug.md`，填好 Front Matter，跑一次 `tools/deploy.sh` 即发布。

> 注意：使用 **SSH** 推送（你一贯要求，不换 HTTPS；GitHub 走 `~/.ssh/id_ed25519_github`）。
> 之所以要 `rsync` 排除 `_site/` 与 `tools/`：前者是本地预览产物、后者是零 Ruby 预览生成器，都不该进仓库（`_config.yml` 的 `exclude` 只管 Jekyll 构建，不管 git）。

---

## 7. 后续可选增强
- 标签 / 分类归档页、分页
- 站内搜索（如 Simple-Jekyll-Search，纯前端）
- 评论（Giscus / utterances，基于 GitHub Issues）
- 项目卡片实时同步 Star（构建前脚本或前端 fetch）
- 自定义域名 + HTTPS
