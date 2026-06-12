# iris-xml2udl

[English](./README.md)

一款 VS Code 插件，用于解析 **InterSystems IRIS XML 导出文件**，并以 **UDL（通用定义语言）** 格式浏览和预览其中的每个组件，支持语法高亮，全程不在磁盘上产生任何临时文件。

> 🚀 **在线体验：** [cryzezz.github.io/iris-xml2udl](https://cryzezz.github.io/iris-xml2udl/) — 在线演示工具 + 完整文档

---

## 安装

1. 打开 VS Code
2. 进入扩展面板（`Ctrl+Shift+X`）
3. 搜索 **iris xml2udl**
4. 点击**安装**

---

## 功能特性

- **右键菜单预览** — 在资源管理器或编辑器中右键任意 `.xml` 文件，选择 `iris xml2udl preview`
- **树形视图侧边栏** — 解析结果显示在 `iris xml2udl` 面板中，按顶层类型分组（Class、CSP、Routine、Project 等）
- **虚拟文档** — 点击树节点后，UDL 内容以虚拟文档形式打开（`xml2udl-udl://` 协议），不写任何磁盘文件
- **自动语法高亮** — 虚拟文档 URI 中附带文件扩展名（`.cls`、`.csp`、`.prj`、`.udl`），VS Code 自动匹配语言模式
- **原生页签行为** — 单击打开预览页签（下次点击会覆盖），双击或再次点击同一项则固定页签，与 VS Code 内置资源管理器行为一致
- **Project 类型自动设为 XML** — Project 组件内容自动设置为 XML 语言模式

---

## 支持的组件类型

| XML 标签 | 文件扩展名 | 语言 |
|---------|-----------|------|
| Class | `.cls` | COS / ObjectScript |
| Routine | `.cls` | COS / ObjectScript |
| CSP (.js) | — | JavaScript |
| CSP（其他） | `.csp` | HTML |
| Project | — | XML |
| Projection | `.prj` | — |
| UDLText | `.udl` | — |

---

## 使用方法

1. 在 VS Code 中打开包含 IRIS XML 导出文件（`.xml`）的文件夹或工作区
2. 在**资源管理器**或**编辑器标题栏**右键任意 `.xml` 文件
3. 选择 **`iris xml2udl preview`**
4. **`iris xml2udl`** 侧边栏面板自动打开，展示按类型分组的所有解析组件
5. 点击任意组件，即可在编辑器中查看其 UDL 内容

---

## 项目结构

```
iris-xml2udl/
├── demo/                        # 基于浏览器的原型（独立 HTML 版本）
│   ├── xml2Udl.html
│   └── xml2Udl.js
└── vscode-extension/            # VS Code 插件
    ├── src/
    │   ├── extension.ts         # 入口 — 注册命令、树视图、文档提供者
    │   ├── xml2UdlEngine.ts     # 核心 XML → UDL 解析引擎（从 demo 移植）
    │   ├── treeDataProvider.ts  # 按组件类型分组的侧边栏树视图
    │   └── udlDocumentProvider.ts # 虚拟文档提供者（xml2udl-udl:// 协议）
    ├── package.json
    └── tsconfig.json
```

---

## 环境要求

- VS Code **1.74.0** 及以上
- 如需 COS/ObjectScript 语法高亮：请安装 [InterSystems ObjectScript 扩展](https://marketplace.visualstudio.com/items?itemName=intersystems-community.vscode-objectscript)

---

## 从源码构建

```bash
cd vscode-extension
npm install
npm run compile
```

然后在 VS Code 中按 **F5** 启动扩展开发主机。

---

## 许可证

[MIT](./vscode-extension/LICENSE)
