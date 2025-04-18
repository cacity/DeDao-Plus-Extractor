// content-script.js - 内容提取功能的内容脚本

// 向后台脚本发送消息，表明内容脚本已加载
chrome.runtime.sendMessage({ action: 'contentScriptReady' });

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 如果是提取内容的请求
  if (request.action === 'extractContent') {
    try {
      // 提取标题
      let title = '';
      if (request.titleSelector) {
        const titleElements = document.querySelectorAll(request.titleSelector);
        if (titleElements.length > 0) {
          title = titleElements[0].textContent.trim();
        }
      }
      
      // 使用提供的内容选择器查找元素
      const elements = document.querySelectorAll(request.contentSelector);
      
      if (elements.length === 0) {
        // 如果没有找到匹配的元素
        sendResponse({
          success: false,
          error: '没有找到匹配的内容元素，请检查选择器是否正确'
        });
        return true;
      }
      
      // 提取内容 - 使用性能更高的方法
      let extractedContent = '';
      
      // 只处理第一个匹配的元素，加快处理速度
      const element = elements[0];
      
      // 获取元素的HTML内容
      const content = element.innerHTML;
      
      // 创建一个临时元素来处理HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // 获取纯文本内容，转换为Markdown格式
      extractedContent = processContent(tempDiv);
      
      // 返回提取的内容和标题
      sendResponse({
        success: true,
        title: title,
        content: extractedContent.trim()
      });
    } catch (error) {
      // 处理错误
      console.error('内容提取错误:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
    
    return true; // 表示异步响应
  }
});

// 处理HTML内容，转换为Markdown格式
function processContent(element) {
  let result = '';
  
  // 递归处理节点
  function processNode(node) {
    // 文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent;
    } 
    // 元素节点
    else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // 处理不同类型的元素，转换为Markdown格式
      if (tagName === 'p') {
        // 段落元素
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        
        // 段落后添加换行
        if (!result.endsWith('\n\n')) {
          result += '\n\n';
        }
      } 
      else if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
        // 容器元素
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
      } 
      else if (tagName === 'br') {
        // 换行元素
        result += '\n';
      } 
      else if (tagName === 'h1') {
        // h1 标题
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '# ';
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '\n\n';
      }
      else if (tagName === 'h2') {
        // h2 标题
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '## ';
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '\n\n';
      }
      else if (tagName === 'h3') {
        // h3 标题
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '### ';
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '\n\n';
      }
      else if (tagName === 'h4') {
        // h4 标题
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '#### ';
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '\n\n';
      }
      else if (tagName === 'h5' || tagName === 'h6') {
        // h5/h6 标题
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '##### ';
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '\n\n';
      }
      else if (tagName === 'ul' || tagName === 'ol') {
        // 列表容器
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        
        if (!result.endsWith('\n\n')) {
          result += '\n\n';
        }
      }
      else if (tagName === 'li') {
        // 列表项
        const parentTag = node.parentNode ? node.parentNode.tagName.toLowerCase() : '';
        if (parentTag === 'ol') {
          // 有序列表项，找出序号
          let index = 1;
          let prev = node.previousElementSibling;
          while (prev) {
            index++;
            prev = prev.previousElementSibling;
          }
          result += `${index}. `;
        } else {
          // 无序列表项
          result += '- ';
        }
        
        // 处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
        
        // 列表项后添加换行
        if (!result.endsWith('\n')) {
          result += '\n';
        }
      }
      else if (tagName === 'img') {
        // 图片，转换为Markdown图片语法
        const alt = node.getAttribute('alt') || '';
        const src = node.getAttribute('src') || '';
        if (src) {
          result += `![${alt}](${src})`;
        }
      }
      else if (tagName === 'a') {
        // 链接，转换为Markdown链接语法
        const href = node.getAttribute('href');
        let linkText = '';
        
        // 获取链接文本
        for (const child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            linkText += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== 'img') {
            // 如果链接内有其他元素，除了图片
            for (const grandchild of child.childNodes) {
              if (grandchild.nodeType === Node.TEXT_NODE) {
                linkText += grandchild.textContent;
              }
            }
          }
        }
        
        // 如果有链接地址
        if (href) {
          // 如果没有文本，使用链接本身
          if (!linkText.trim()) {
            linkText = href;
          }
          result += `[${linkText}](${href})`;
        } else {
          // 如果没有链接地址，只保留文本
          result += linkText;
        }
      }
      else if (tagName === 'strong' || tagName === 'b') {
        // 粗体
        result += '**';
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '**';
      }
      else if (tagName === 'em' || tagName === 'i') {
        // 斜体
        result += '*';
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '*';
      }
      else if (tagName === 'code') {
        // 行内代码
        result += '`';
        for (const child of node.childNodes) {
          processNode(child);
        }
        result += '`';
      }
      else if (tagName === 'pre') {
        // 代码块
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '```\n';
        for (const child of node.childNodes) {
          processNode(child);
        }
        if (!result.endsWith('\n')) {
          result += '\n';
        }
        result += '```\n\n';
      }
      else if (tagName === 'blockquote') {
        // 引用块
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        
        // 处理子节点并在每行前添加 > 
        let quoteContent = '';
        for (const child of node.childNodes) {
          const prevLength = result.length;
          processNode(child);
          quoteContent += result.substring(prevLength);
        }
        
        // 清除引用内容从结果中
        result = result.substring(0, result.length - quoteContent.length);
        
        // 处理引用内容，每行前添加 > 
        const lines = quoteContent.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            result += '> ' + line + '\n';
          } else if (line === '') {
            result += '\n';
          }
        }
        
        result += '\n';
      }
      else if (tagName === 'hr') {
        // 水平线
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += '---\n\n';
      }
      else if (tagName === 'table') {
        // 表格
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        
        // 处理表格内容
        const rows = node.querySelectorAll('tr');
        const headerCells = node.querySelectorAll('th');
        
        // 处理表头
        if (headerCells.length > 0) {
          let headerRow = '| ';
          let separatorRow = '| ';
          
          for (const cell of headerCells) {
            let cellContent = '';
            for (const child of cell.childNodes) {
              const prevLength = result.length;
              processNode(child);
              cellContent += result.substring(prevLength);
            }
            headerRow += cellContent.replace(/\n/g, ' ').trim() + ' | ';
            separatorRow += '--- | ';
          }
          
          // 清除表头内容从结果中
          result = result.substring(0, result.length - headerRow.length);
          
          result += headerRow + '\n' + separatorRow + '\n';
        }
        
        // 处理表体
        for (const row of rows) {
          if (row.querySelector('th')) continue; // 跳过表头行
          
          let rowContent = '| ';
          const cells = row.querySelectorAll('td');
          
          for (const cell of cells) {
            let cellContent = '';
            for (const child of cell.childNodes) {
              const prevLength = result.length;
              processNode(child);
              cellContent += result.substring(prevLength);
            }
            rowContent += cellContent.replace(/\n/g, ' ').trim() + ' | ';
          }
          
          // 清除行内容从结果中
          result = result.substring(0, result.length - rowContent.length);
          
          result += rowContent + '\n';
        }
        
        result += '\n';
      }
      else {
        // 其他元素，直接处理子节点
        for (const child of node.childNodes) {
          processNode(child);
        }
      }
    }
  }
  
  // 开始处理
  processNode(element);
  
  // 清理多余的空行和空格
  return result.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}
