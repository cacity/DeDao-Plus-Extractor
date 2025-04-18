# 得到内容提取器 (DeDao Content Extractor)

![Logo](chrome/images/icon128.png)

---

## 简介 | Introduction

### 中文说明
得到内容提取器是一款专为知识平台用户打造的高效内容采集工具。支持在“得到”、“知乎”、“简书”、“微信公众号”等主流平台一键提取网页正文和标题，自动批量操作，导出为 EPUB 或 TXT 文件，方便整理、阅读和保存。插件支持站点类型自动识别，也允许高级用户自定义选择器，满足多样化需求。

**主要功能：**
- 支持多平台内容提取（得到、知乎、简书、微信公众号等）
- 一键批量提取，自动跳转与保存
- 导出为 EPUB 电子书或 TXT 文本
- 拖拽排序、批量合并、内容管理
- 站点类型自动识别与手动切换
- 简单易用，界面友好
- 完全本地运行，数据安全可靠

### English Description
DeDao Content Extractor is an efficient tool designed for knowledge platform users. It enables one-click extraction of main content and titles from popular sites like DeDao, Zhihu, Jianshu, and WeChat Official Accounts, with batch operations and export to EPUB or TXT for easy management and reading.

**Key Features:**
- Multi-platform content extraction (DeDao, Zhihu, Jianshu, WeChat, etc.)
- One-click batch extraction, auto navigation and saving
- Export as EPUB e-books or TXT files
- Drag-and-drop sorting, batch merging, content management
- Auto-detection and manual switch of site type
- User-friendly interface, easy to use
- All operations are performed locally for maximum data security

---

## 主要功能

> **2025-04-18 更新：已支持自动化批量提取，详见下方“自动导航按钮”说明。

- **智能内容提取**：使用自定义CSS选择器从网页中提取文章内容和标题
- **文章导航**：通过上一篇和下一篇按钮快速浏览文章内容
- **自动导航按钮**：新增“自动上一篇”和“自动下一篇”按钮，实现自动化批量内容提取与跳转操作，提高效率
- **多种导出格式**：支持导出为EPUB电子书和TXT文本文件
- **内容管理**：保存、组织和管理多个提取的内容
- **拖拽排序**：通过拖拽调整内容项的顺序
- **批量操作**：全选功能和批量合并
- **格式优化**：自动处理多余的空格和空行，使导出的内容更加整洁

## 安装方法

### 从 Chrome 应用商店安装

1. 访问 [Chrome 应用商店链接](#)
2. 点击"添加到 Chrome"按钮
3. 确认安装

### 手动安装

1. 下载此仓库并解压缩
2. 在 Chrome 浏览器中访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的 `chrome` 文件夹

## 使用指南

### 提取内容与文章导航

1. 浏览到您想要提取内容的网页
2. 点击浏览器工具栏中的得到内容提取器图标
3. 在弹出的侧边栏中，使用“站点类型”下拉框选择目标网站（支持自动识别当前网页域名，也可手动切换）
   - 选择后会自动填充内容选择器和标题选择器
   - 高级用户也可手动编辑选择器输入框，实现自定义提取
4. 使用文章导航功能：
   - 点击"上一篇"按钮可以切换到上一篇文章
   - 点击"下一篇"按钮可以切换到下一篇文章
   - 点击“自动上一篇”或“自动下一篇”按钮时，插件会自动依次执行：
     1. 点击“提取内容”按钮，自动提取当前内容
     2. 等待约1秒（确保内容处理完成）
     3. 自动跳转到上一篇或下一篇文章
   - 该流程可大幅提升批量提取内容时的便捷性
5. 点击"提取内容"按钮提取当前文章
6. 如果勾选了"自动保存到下载文件夹"，内容将自动保存到下载列表中

### 管理内容

- **排序内容**：通过拖拽下载列表中的项目来调整它们的顺序
- **选择内容**：勾选项目前面的复选框，或使用"全选"按钮
- **清空列表**：点击"清空列表"按钮可以删除所有保存的内容

### 导出内容

1. 选择要导出的内容项（勾选复选框）
2. 选择导出格式：
   - **EPUB**：点击"合并成EPUB"按钮生成电子书
   - **TXT**：点击"合并成TXT"按钮生成文本文件
3. 生成的文件将自动下载到您的计算机上

## 站点类型与自定义选择器

插件支持“站点类型”下拉框，自动识别当前网页域名并切换到合适的选择器组合。用户也可手动切换站点类型，或直接编辑选择器输入框，实现个性化内容提取。

以下是常用网站的选择器示例：

| 网站 | 内容选择器 | 标题选择器 |
|----------|--------------|------------|
| 得到App | `.article-body` | `.article-title.iget-common-c1` |
| 知乎 | `.RichContent-inner` | `.QuestionHeader-title` |
| 简书 | `.article` | `.title` |
| 微信公众号 | `.rich_media_content` | `.rich_media_title` |

## 特性说明

### 空格和空行处理

得到内容提取器会自动处理提取的内容，优化格式：

- 将连续的多个空格替换为单个空格
- 将连续的多个空行压缩为单个空行
- 删除行首和行尾的空格
- 处理Markdown格式的标题和列表，确保正确的格式

### EPUB生成

生成的EPUB电子书具有以下特点：

- 使用UTF-8编码，确保中文显示正常
- 包含目录和导航功能
- 每个选中的内容项作为一个独立章节
- 自动将Markdown格式转换为HTML

## 常见问题

### 无法提取内容

如果默认选择器无法提取内容，请尝试：

1. 使用浏览器开发者工具检查网页结构
2. 找到内容和标题元素的CSS选择器
3. 在插件中输入自定义选择器

插件会尝试使用通用选择器（如article, .article, .post, .content, main）作为备用方案。

### EPUB文件显示乱码

如果生成的EPUB文件在某些设备上显示乱码，请确保您的阅读器支持UTF-8编码。大多数现代电子书阅读器都支持这种编码。

## 贡献指南

欢迎对该项目进行贡献！如果您有任何建议或发现了问题，请提交Issue或Pull Request。

## 版权和许可

本项目采用MIT许可证。请注意，使用该工具提取的内容可能受到版权保护，请尊重原作者的权利并仅将提取的内容用于个人学习和研究目的。

## 版本历史

- **v1.0.0** (2025-04-12)
  - 初始版本发布
  - 支持内容提取、EPUB和TXT导出
  - 实现拖拽排序和内容管理
- **v1.1.0** (2025-04-15)
  - 新增上一篇和下一篇导航按钮
  - 优化用户界面和交互体验
- **v1.2.0** (2025-04-18)
  - 新增“自动上一篇”和“自动下一篇”按钮，支持自动提取内容并跳转，提升批量操作效率
