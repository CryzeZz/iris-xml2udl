# iris xml2udl

[English](./README.md)

一款 VS Code 插件，用于解析 **InterSystems IRIS XML 导出文件**，并以 **UDL（通用定义语言）** 格式在编辑器中浏览和预览其中的每个组件，支持语法高亮。

## 安装

1. 打开 VS Code
2. 进入扩展面板（`Ctrl+Shift+X`）
3. 搜索 **iris xml2udl**
4. 点击**安装**

## 功能特性

- **右键任意 `.xml` 文件**，选择 `iris xml2udl preview` 进行解析
- 在侧边栏树视图中按顶层类型分组浏览解析的组件（Class、CSP、Routine、Project 等）
- 点击任意项，以正确的文件扩展名（`.cls`、`.csp`、`.prj`、`.udl`、`.mac`、`.inc` 等）在编辑器中打开 UDL 内容
- VS Code 根据文件扩展名自动检测语言模式，提供语法高亮
- 预览页签行为与 VS Code 原生资源管理器一致（单击预览，双击固定）

## 使用方法

1. 在资源管理器或编辑器中右键 IRIS XML 导出文件
2. 选择 **iris xml2udl preview**
3. `iris xml2udl` 侧边栏面板自动打开，按顶层类型分组显示所有解析的组件
4. 点击任意组件即可在编辑器中查看其 UDL 内容

## 环境要求

- VS Code 1.74.0 及以上

## 插件设置

本插件提供以下视图和命令：

- 资源管理器侧边栏的 `iris xml2udl` 视图
- `iris xml2udl preview` 命令（可在 `.xml` 文件的编辑器和资源管理器上下文菜单中使用）
