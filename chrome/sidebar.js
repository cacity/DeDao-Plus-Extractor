// sidebar.js - 侧边栏的交互逻辑

// 当侧边栏加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素 - 内容提取标签页
  const siteTypeSelect = document.getElementById('site-type');
  const cssSelectorInput = document.getElementById('css-selector');
  const titleSelectorInput = document.getElementById('title-selector');
  const autoSaveCheckbox = document.getElementById('auto-save');
  const extractContentButton = document.getElementById('extract-content');
  const prevArticleButton = document.getElementById('prev-article');
  const nextArticleButton = document.getElementById('next-article');
  // 新增：获取自动上一篇和自动下一篇按钮
  const autoPrevArticleButton = document.getElementById('auto-prev-article');
  const autoNextArticleButton = document.getElementById('auto-next-article');
  // 新增：获取批量操作相关的输入框和按钮
  const autoPrevCountInput = document.getElementById('auto-prev-count'); // 次数输入框
  const autoPrevIntervalInput = document.getElementById('auto-prev-interval'); // 间隔输入框
  const autoPrevBatchBtn = document.getElementById('auto-prev-batch-btn'); // 自动化按钮
  const downloadList = document.getElementById('download-list');
  const mergeSelectedButton = document.getElementById('merge-selected');
  const clearListButton = document.getElementById('clear-list');

  // 站点类型与选择器映射
  const siteSelectorMap = {
    dedao: {
      css: '.article-body',
      title: '.article-title.iget-common-c1'
    },
    zhihu: {
      css: '.RichContent-inner',
      title: '.QuestionHeader-title'
    },
    jianshu: {
      css: '.article',
      title: '.title'
    },
    wechat: {
      css: '.rich_media_content',
      title: '.rich_media_title'
    }
  };

  // 根据域名自动选择站点类型
  function detectSiteType() {
    const host = window.location.host;
    if (host.includes('zhihu.com')) return 'zhihu';
    if (host.includes('jianshu.com')) return 'jianshu';
    if (host.includes('mp.weixin.qq.com')) return 'wechat';
    // 默认
    return 'dedao';
  }

  // 根据站点类型切换选择器
  function updateSelectorsBySite(siteType) {
    const selectors = siteSelectorMap[siteType];
    if (selectors) {
      cssSelectorInput.value = selectors.css;
      titleSelectorInput.value = selectors.title;
    }
  }

  // 页面加载时自动检测并设置
  const detectedSite = detectSiteType();
  siteTypeSelect.value = detectedSite;
  updateSelectorsBySite(detectedSite);

  // 下拉框切换事件
  siteTypeSelect.addEventListener('change', function() {
    const selected = siteTypeSelect.value;
    updateSelectorsBySite(selected);
  });
  
  // 全局变量存储提取的标题和下载项
  let extractedTitle = '';
  let downloadItems = [];
  let extractedContent = ''; // 存储当前提取的内容
  
  // 从存储中加载上次使用的选择器、设置和下载项
  chrome.storage.local.get([
    'lastCssSelector', 
    'lastTitleSelector', 
    'autoSave', 
    'downloadItems'
  ], function(result) {
    if (result.lastCssSelector) {
      cssSelectorInput.value = result.lastCssSelector;
    }
    
    if (result.lastTitleSelector) {
      titleSelectorInput.value = result.lastTitleSelector;
    }
    
    if (result.autoSave !== undefined) {
      autoSaveCheckbox.checked = result.autoSave;
    }
    
    if (result.downloadItems && Array.isArray(result.downloadItems)) {
      downloadItems = result.downloadItems;
      renderDownloadList();
    }
  });
  
  // 内容提取标签页设置
  function setupContentTab() {
    console.log('初始化内容提取标签页');
    
    // 获取内容提取标签页元素
    const contentTab = document.getElementById('content-tab');
    
    if (!contentTab) {
      console.error('内容提取标签页元素不存在');
      return;
    }
    
    // 确保内容提取标签页始终显示
    contentTab.classList.add('active');
    
    console.log('内容提取标签页设置完成');
  }
  
  // 调用内容提取标签页设置函数
  setupContentTab();
  
  // 可折叠区域功能
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', function() {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      content.classList.toggle('collapsed');
      
      // 切换展开/折叠图标
      const toggleIcon = this.querySelector('.toggle-icon');
      if (toggleIcon) {
        toggleIcon.textContent = content.classList.contains('collapsed') ? '+' : '-';
      }
    });
  });
  
  // 提取内容功能 - 简化版
  function extractContent() {
    console.log('开始提取内容');
    
    // 显示加载状态
    const contentDisplay = document.createElement('div');
    contentDisplay.innerHTML = '<p class="loading">正在提取内容...</p>';
    downloadList.parentNode.insertBefore(contentDisplay, downloadList);
    
    // 禁用按钮，防止重复点击
    extractContentButton.disabled = true;
    extractContentButton.textContent = '正在提取...';
    
    // 获取当前标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        contentDisplay.innerHTML = '<p class="error">无法获取当前标签页</p>';
        extractContentButton.disabled = false;
        extractContentButton.textContent = '提取内容';
        return;
      }
      
      const tab = tabs[0];
      console.log('当前标签页:', tab.url);
      
      // 获取选择器
      const contentSelector = cssSelectorInput.value || '.article-body';
      const titleSelector = titleSelectorInput.value || '.article-title.iget-common-c1';
      
      // 保存选择器到存储中
      chrome.storage.local.set({
        'lastCssSelector': contentSelector,
        'lastTitleSelector': titleSelector,
        'autoSave': autoSaveCheckbox.checked
      });
      
      // 直接在页面上执行脚本提取内容
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function(contentSelector, titleSelector) {
          try {
            // 提取标题
            let title = document.title; // 默认使用页面标题
            const titleElements = document.querySelectorAll(titleSelector);
            if (titleElements.length > 0) {
              title = titleElements[0].textContent.trim();
            }
            
            // 提取内容
            let content = '';
            const contentElements = document.querySelectorAll(contentSelector);
            
            if (contentElements.length > 0) {
              // 获取内容
              content = contentElements[0].innerText;
            } else {
              // 如果没有找到内容，尝试获取整个文章区域
              const articleElements = document.querySelectorAll('article, .article, .post, .content, main');
              if (articleElements.length > 0) {
                content = articleElements[0].innerText;
              }
            }
            
            // 强化处理多余的空格和空行
            content = content
              // 将连续的多个空格替换为单个空格
              .replace(/[ \t]+/g, ' ')
              // 先将所有空行标准化（只包含\n的行）
              .replace(/\n[ \t]*\n/g, '\n')
              // 将连续的多个空行压缩为一个空行
              .replace(/\n{3,}/g, '\n')
              // 删除行首和行尾的空格
              .replace(/^[ \t]+|[ \t]+$/gm, '')
              // 删除文本开头和结尾的空白行
              .trim()
              // 再次检查并处理可能遗漏的空行
              .replace(/\n\s*\n\s*\n/g, '\n');
              
            // 处理特殊情况：对于MD格式的标题后添加一个空行，确保格式正确
            content = content
              .replace(/(^|\n)(#{1,6}\s.*?)(\n)(?!\n)/g, '$1$2\n\n')
              // 处理列表项前后的空行
              .replace(/(\n\n)([-*+]\s)/g, '\n$2')
              .replace(/([^\n])(\n)([-*+]\s)/g, '$1\n\n$3');
            
            return {
              success: true,
              title: title,
              content: content,
              url: window.location.href
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        },
        args: [contentSelector, titleSelector]
      })
      .then(results => {
        // 重置按钮状态
        extractContentButton.disabled = false;
        extractContentButton.textContent = '提取内容';
        
        if (results && results.length > 0) {
          const result = results[0].result;
          console.log('提取结果:', result);
          
          if (result.success && result.content) {
            // 移除加载提示
            contentDisplay.remove();
            
            // 保存提取的内容
            extractedTitle = result.title;
            extractedContent = result.content;
            
            // 显示成功提示
            showNotification('内容提取成功');
            
            // 如果选中了自动保存，则保存内容
            if (autoSaveCheckbox.checked) {
              saveContent(result.content, result.title);
            }
          } else {
            contentDisplay.innerHTML = `<p class="error">提取内容失败: ${result.error || '未找到内容'}</p>`;
          }
        } else {
          contentDisplay.innerHTML = '<p class="error">执行脚本失败</p>';
        }
      })
      .catch(error => {
        console.error('提取内容错误:', error);
        contentDisplay.innerHTML = `<p class="error">提取内容错误: ${error.message}</p>`;
        extractContentButton.disabled = false;
        extractContentButton.textContent = '提取内容';
      });
    });
  }
  
  // 重置提取按钮状态
  function resetExtractButton() {
    extractContentButton.disabled = false;
    extractContentButton.textContent = '提取内容';
  }
  
  // 复制提取的内容到剪贴板
  function copyExtractedContent() {
    if (!extractedContent) {
      showNotification('没有可复制的内容');
      return;
    }
    
    navigator.clipboard.writeText(extractedContent)
      .then(() => {
        showNotification('内容已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        showNotification('复制失败: ' + err.message);
      });
  }
  
  // 显示通知提示
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 淡入效果
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 3秒后淡出
    setTimeout(() => {
      notification.classList.remove('show');
      
      // 淡出后移除元素
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  // 保存内容并添加到下载列表
  function saveContent(content, title) {
    if (!content || content.trim() === '') {
      showNotification('内容为空，无法保存');
      return;
    }
    
    const now = new Date();
    const timestamp = now.getTime();
    const formattedDate = formatTime(now);
    
    // 如果没有标题，使用日期作为标题
    if (!title || title.trim() === '') {
      title = '提取内容 - ' + formattedDate;
    }
    
    // 创建下载项
    const downloadItem = {
      id: timestamp,
      title: title,
      content: content,
      date: formattedDate,
      selected: false
    };
    
    // 添加到下载列表
    downloadItems.unshift(downloadItem);
    
    // 保存到存储
    chrome.storage.local.set({ 'downloadItems': downloadItems });
    
    // 更新界面
    renderDownloadList();
    
    // 显示通知
    showNotification('内容已保存');
  }
  
  // 渲染下载列表
  function renderDownloadList() {
    // 清空列表
    downloadList.innerHTML = '';
    
    if (downloadItems.length === 0) {
      downloadList.innerHTML = '<li class="download-item-empty">暂无下载记录</li>';
      return;
    }
    
    // 添加下载项
    downloadItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'download-item';
      li.dataset.id = item.id;
      
      // 添加拖拽属性
      li.draggable = true;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'download-checkbox';
      checkbox.checked = item.selected;
      checkbox.addEventListener('change', function() {
        // 更新选中状态
        const id = parseInt(this.parentElement.dataset.id);
        const index = downloadItems.findIndex(item => item.id === id);
        if (index !== -1) {
          downloadItems[index].selected = this.checked;
          chrome.storage.local.set({ 'downloadItems': downloadItems });
        }
      });
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'download-title';
      titleSpan.textContent = item.title;
      
      const dateSpan = document.createElement('span');
      dateSpan.className = 'download-date';
      dateSpan.textContent = item.date;
      
      li.appendChild(checkbox);
      li.appendChild(titleSpan);
      li.appendChild(dateSpan);
      
      // 添加拖拽事件
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('dragleave', handleDragLeave);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);
      
      downloadList.appendChild(li);
    });
  }
  
  // 拖拽相关变量
  let draggedItem = null;
  
  // 开始拖拽
  function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    
    // 设置拖拽数据
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    
    // 延迟添加半透明效果，以便能看到拖拽开始的视觉效果
    setTimeout(() => {
      this.style.opacity = '0.7';
    }, 0);
  }
  
  // 拖拽经过
  function handleDragOver(e) {
    e.preventDefault(); // 允许放置
    e.dataTransfer.dropEffect = 'move';
    
    // 添加视觉指示
    if (this !== draggedItem) {
      this.classList.add('drag-over');
    }
    
    return false;
  }
  
  // 拖拽离开
  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }
  
  // 放置
  function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    // 移除视觉指示
    this.classList.remove('drag-over');
    
    // 如果放置在自己上面，不做任何操作
    if (draggedItem === this) {
      return false;
    }
    
    // 获取拖拽项和目标项的ID
    const draggedItemId = parseInt(draggedItem.dataset.id);
    const targetItemId = parseInt(this.dataset.id);
    
    // 找到对应的索引
    const draggedIndex = downloadItems.findIndex(item => item.id === draggedItemId);
    const targetIndex = downloadItems.findIndex(item => item.id === targetItemId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 从数组中移除拖拽项
      const [draggedItem] = downloadItems.splice(draggedIndex, 1);
      
      // 将拖拽项插入到目标位置
      downloadItems.splice(targetIndex, 0, draggedItem);
      
      // 保存新的顺序到存储
      chrome.storage.local.set({ 'downloadItems': downloadItems });
      
      // 重新渲染列表
      renderDownloadList();
    }
    
    return false;
  }
  
  // 拖拽结束
  function handleDragEnd(e) {
    // 移除所有拖拽相关的样式
    const items = document.querySelectorAll('.download-item');
    items.forEach(item => {
      item.classList.remove('dragging');
      item.classList.remove('drag-over');
      item.style.opacity = '';
    });
    
    draggedItem = null;
  }
  
  // 格式化时间
  function formatTime(date) {
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }
  
  // 数字前面补零
  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }
  
  // 将选中项合并成EPUB电子书
  function mergeSelectedItems() {
    // 获取选中的项
    const selectedItems = downloadItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      showNotification('请先选择要合并的内容');
      return;
    }
    
    // 提示正在生成
    showNotification('正在生成EPUB电子书...');
    
    // 生成电子书标题 (使用第一个选中项的标题)
    const bookTitle = selectedItems[0].title;
    
    // 准备章节
    const chapters = selectedItems.map((item, index) => {
      return {
        title: item.title,
        content: markdownToHtml(item.content),
        order: index + 1
      };
    });
    
    // 创建EPUB
    createEpub(bookTitle, chapters)
      .then(epubBlob => {
        // 创建下载链接
        const url = URL.createObjectURL(epubBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bookTitle}.epub`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('EPUB电子书生成成功');
      })
      .catch(error => {
        console.error('生成EPUB失败:', error);
        showNotification('生成EPUB失败: ' + error.message);
      });
  }
  
  // 将选中项合并成TXT文件
  function mergeSelectedToTxt() {
    // 获取选中的项
    const selectedItems = downloadItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      showNotification('请先选择要合并的内容');
      return;
    }
    
    // 提示正在生成
    showNotification('正在生成TXT文件...');
    
    // 生成TXT文件标题 (使用第一个选中项的标题)
    const fileTitle = selectedItems[0].title;
    
    // 合并所有选中的内容
    let txtContent = '';
    
    selectedItems.forEach((item, index) => {
      // 添加标题和分隔线
      txtContent += `\n\n${'='.repeat(30)}\n${item.title}\n${'='.repeat(30)}\n\n`;
      
      // 添加内容
      txtContent += item.content;
      
      // 在每个项目后添加空行，除了最后一个
      if (index < selectedItems.length - 1) {
        txtContent += '\n\n';
      }
    });
    
    // 创建TXT Blob
    const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(txtBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    showNotification('TXT文件生成成功');
  }
  
  // 全选功能
  function selectAllItems() {
    if (downloadItems.length === 0) {
      showNotification('暂无内容可选');
      return;
    }
    
    // 检查当前是否全部选中
    const allSelected = downloadItems.every(item => item.selected);
    
    // 如果全部选中，则取消全选；否则全选
    downloadItems.forEach(item => {
      item.selected = !allSelected;
    });
    
    // 保存到存储
    chrome.storage.local.set({ 'downloadItems': downloadItems });
    
    // 重新渲染列表
    renderDownloadList();
    
    // 显示通知
    showNotification(allSelected ? '已取消全选' : '已全选所有内容');
  }
  
  // 将Markdown转换为HTML
  function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // 简单的Markdown转HTML实现
    let html = markdown;
    
    // 转换标题
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
    html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
    
    // 转换粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 转换斜体
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 转换链接
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // 转换图片
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    
    // 转换列表
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>');
    
    // 转换段落
    html = html.replace(/^(?!<[a-z])(.*?)$/gm, '<p>$1</p>');
    
    // 替换换行符
    html = html.replace(/\n/g, '');
    
    return html;
  }
  
  // 创建EPUB电子书
  function createEpub(title, chapters) {
    return new Promise((resolve, reject) => {
      try {
        // 创建JSZip实例
        const zip = new JSZip();
        
        // 添加mimetype文件
        zip.file('mimetype', 'application/epub+zip');
        
        // 添加META-INF目录
        const metaInf = zip.folder('META-INF');
        metaInf.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);
        
        // 添加OEBPS目录
        const oebps = zip.folder('OEBPS');
        
        // 添加样式表
        oebps.file('stylesheet.css', `
body {
  font-family: serif;
  margin: 5%;
  text-align: justify;
}
h1, h2, h3, h4, h5, h6 {
  font-family: sans-serif;
  margin-top: 2em;
  margin-bottom: 1em;
}
h1 { font-size: 1.5em; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.1em; }
p { margin: 1em 0; }
`);
        
        // 生成EPUB内容
        const epubContent = generateEpubContent(title, chapters);
        
        // 添加内容文件
        oebps.file('content.opf', epubContent.opf);
        oebps.file('toc.ncx', epubContent.ncx);
        
        // 添加章节文件
        chapters.forEach((chapter, index) => {
          oebps.file(`chapter${index + 1}.html`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <h1>${chapter.title}</h1>
  ${chapter.content}
</body>
</html>`);
        });
        
        // 生成EPUB文件
        zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })
          .then(blob => {
            resolve(blob);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // 生成EPUB文件的内容
  function generateEpubContent(title, chapters) {
    // 生成唯一标识符
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    // 生成OPF文件
    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${title}</dc:title>
    <dc:language>zh-CN</dc:language>
    <dc:identifier id="BookID">urn:uuid:${uuid}</dc:identifier>
    <dc:creator>得到内容提取器</dc:creator>
    <dc:publisher>得到内容提取器</dc:publisher>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="stylesheet.css" media-type="text/css"/>
${chapters.map((chapter, index) => `    <item id="chapter${index + 1}" href="chapter${index + 1}.html" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine toc="ncx">
${chapters.map((chapter, index) => `    <itemref idref="chapter${index + 1}"/>`).join('\n')}
  </spine>
  <guide>
    <reference type="toc" title="目录" href="chapter1.html"/>
    <reference type="text" title="开始" href="chapter1.html"/>
  </guide>
</package>`;
    
    // 生成NCX文件
    const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${title}</text>
  </docTitle>
  <navMap>
${chapters.map((chapter, index) => `    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${chapter.title}</text>
      </navLabel>
      <content src="chapter${index + 1}.html"/>
    </navPoint>`).join('\n')}
  </navMap>
</ncx>`;
    
    return { opf, ncx };
  }
  
  // 上一篇按钮功能实现
  function navigateToPrevArticle() {
    console.log('点击了上一篇按钮');
    // 获取当前标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        showNotification('无法获取当前标签页');
        return;
      }
      
      const tab = tabs[0];
      
      // 在页面中执行脚本，模拟点击上一篇按钮
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function() {
          try {
            // 查找左侧页面上一篇按钮并点击
            const prevButton = document.querySelector('.side-button-main .button-module .button .prev').closest('button');
            if (prevButton) {
              prevButton.click();
              return { success: true, message: '已切换到上一篇' };
            } else {
              return { success: false, message: '未找到上一篇按钮' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      })
      .then(results => {
        if (results && results.length > 0) {
          const result = results[0].result;
          if (result.success) {
            showNotification(result.message);
          } else {
            showNotification(result.message || result.error || '切换失败');
          }
        }
      });
    });
  }
  
  // 下一篇按钮功能实现
  function navigateToNextArticle() {
    console.log('点击了下一篇按钮');
    // 获取当前标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        showNotification('无法获取当前标签页');
        return;
      }
      
      const tab = tabs[0];
      
      // 在页面中执行脚本，模拟点击下一篇按钮
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function() {
          try {
            // 查找左侧页面下一篇按钮并点击
            // 根据提供的HTML，下一篇按钮没有prev类，而是直接使用iget-icon-more类
            const nextButtons = document.querySelectorAll('.side-button-main .button-module .button .iget-icon-more');
            // 找到不包含prev类的按钮（下一篇按钮）
            let nextButton = null;
            for (let i = 0; i < nextButtons.length; i++) {
              if (!nextButtons[i].classList.contains('prev')) {
                nextButton = nextButtons[i].closest('button');
                break;
              }
            }
            
            if (nextButton) {
              nextButton.click();
              return { success: true, message: '已切换到下一篇' };
            } else {
              return { success: false, message: '未找到下一篇按钮' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      })
      .then(results => {
        if (results && results.length > 0) {
          const result = results[0].result;
          if (result.success) {
            showNotification(result.message);
          } else {
            showNotification(result.message || result.error || '切换失败');
          }
        }
      });
    });
  }

  // 内容提取按钮事件
  extractContentButton.addEventListener('click', function() {
    console.log('点击了提取内容按钮');
    extractContent();
  });
  
  // 上一篇按钮事件
  prevArticleButton.addEventListener('click', function() {
    navigateToPrevArticle();
  });
  
  // 下一篇按钮事件
  nextArticleButton.addEventListener('click', function() {
    navigateToNextArticle();
  });
  
  // 自动上一篇按钮事件
  // 点击后依次自动点击“提取内容”，等待1秒后点击“上一篇”
  autoPrevArticleButton.addEventListener('click', function() {
    // 1. 触发“提取内容”按钮点击
    extractContentButton.click();
    // 2. 等待1秒后，触发“上一篇”按钮点击
    setTimeout(function() {
      prevArticleButton.click();
    }, 1000); // 1000毫秒 = 1秒
  });

  // 自动下一篇按钮事件
  // 点击后依次自动点击“提取内容”，等待1秒后点击“下一篇”
  autoNextArticleButton.addEventListener('click', function() {
    // 1. 触发“提取内容”按钮点击
    extractContentButton.click();
    // 2. 等待1秒后，触发“下一篇”按钮点击
    setTimeout(function() {
      nextArticleButton.click();
    }, 1000); // 1000毫秒 = 1秒
  });

  // 批量自动上一篇操作
  // 点击后，按输入的次数和间隔，循环执行“自动上一篇”操作
  autoPrevBatchBtn.addEventListener('click', function() {
    // 获取用户输入的次数和间隔（秒）
    let count = parseInt(autoPrevCountInput.value, 10);
    let interval = parseInt(autoPrevIntervalInput.value, 10);
    // 校验输入
    if (isNaN(count) || count < 1) count = 1;
    if (isNaN(interval) || interval < 1) interval = 1;
    // 禁用按钮防止重复点击
    autoPrevBatchBtn.disabled = true;
    autoPrevBatchBtn.textContent = '操作中...';
    let current = 0;
    // 定义递归函数，依次执行自动上一篇
    function autoPrevStep() {
      if (current >= count) {
        // 全部操作完成，恢复按钮
        autoPrevBatchBtn.disabled = false;
        autoPrevBatchBtn.textContent = '上一篇自动化操作';
        showNotification('批量自动上一篇操作完成');
        return;
      }
      // 触发自动上一篇（模拟点击自动上一篇按钮）
      autoPrevArticleButton.click();
      current++;
      // 继续下一次
      setTimeout(autoPrevStep, interval * 1000);
    }
    // 启动第一次
    autoPrevStep();
  });

  // 清空列表按钮事件
  clearListButton.addEventListener('click', function() {
    if (downloadItems.length === 0) {
      showNotification('列表已经为空');
      return;
    }
    
    if (confirm('确定要清空下载列表吗？此操作不可恢复。')) {
      downloadItems = [];
      chrome.storage.local.set({ 'downloadItems': downloadItems });
      renderDownloadList();
      showNotification('下载列表已清空');
    }
  });
  
  // 合并成EPUB按钮事件
  mergeSelectedButton.addEventListener('click', function() {
    mergeSelectedItems();
  });
  
  // 合并成TXT按钮事件
  const mergeTxtButton = document.getElementById('merge-txt');
  mergeTxtButton.addEventListener('click', function() {
    mergeSelectedToTxt();
  });
  
  // 全选按钮事件
  const selectAllButton = document.getElementById('select-all');
  selectAllButton.addEventListener('click', function() {
    selectAllItems();
  });
});
