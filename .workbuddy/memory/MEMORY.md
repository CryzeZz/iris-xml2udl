# xml2udl 项目记忆

## 项目概述
将 InterSystems XML 导出文件解析并转换为 UDL (Universal Definition Language) 格式。

## 关键文件
- `demo/xml2udl.html` — 浏览器版界面
- `demo/xml2Udl.js` — 核心解析逻辑（原始版本）
- `vscode-extension/` — VSCode 扩展插件

## VSCode 扩展架构
- **源码**：`src/extension.ts`, `src/xml2UdlEngine.ts`, `src/treeDataProvider.ts`, `src/udlDocumentProvider.ts`
- **编译输出**：`out/` 目录
- **依赖**：@xmldom/xmldom（XML 解析），@types/vscode
- **虚拟文档 URI scheme**：`xml2udl-udl://`
- **命令**：`xml2udl.preview`（预览），`xml2udl.openItem`（打开项）
- **TreeView ID**：`xml2udl.treeView`
- **视图名称**：XML to UDL

## 解析逻辑要点
- XML 根元素为 `<Export>`，其子元素按 tagName 分类（Class/Property/Index/Method/Query/Trigger/Storage/ForeignKey/XData/UDLText/Projection/CSP/Routine/CSPBase64/Project）
- `_META` 对象定义各类型的元数据 schema（字段类型、布尔值的 on/off 文本等）
- `parseComm` 函数解析公共子元素（Description, Parameter）
- `FormalSpec` 使用状态机解析方法/查询的参数签名
- `cls2Udl` 是 Class 类型的主转换函数，会递归转换其子元素
- 语言关联：Class/Routine → cos, CSP(.js) → javascript, CSP → html, Project → xml
