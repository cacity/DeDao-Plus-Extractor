// 导出书签功能
function exportBookmarks(format, sendResponse) {
  console.log('开始导出书签，格式：', format);
  
  // 获取所有书签数据
  chrome.storage.local.get(['bookmarkData'], function(result) {
    const bookmarkData = result.bookmarkData;
    if (!bookmarkData) {
      sendResponse({status: 'error', message: '没有找到书签数据'});
      return;
    }
    
    // 合并所有分类中的书签
    let allBookmarks = [];
    for (let category in bookmarkData.categories) {
      allBookmarks = allBookmarks.concat(bookmarkData.categories[category]);
    }
    
    // 添加归档的书签
    allBookmarks = allBookmarks.concat(bookmarkData.archives);
    
    // 根据不同格式导出
    let exportData;
    let fileName;
    let mimeType;
    
    if (format === 'json') {
      // JSON格式
      exportData = JSON.stringify(allBookmarks, null, 2);
      fileName = 'bookmarks_' + new Date().toISOString().slice(0, 10) + '.json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      // CSV格式
      exportData = 'Title,URL,Category,Date Added\n';
      allBookmarks.forEach(bookmark => {
        // 查找书签所在的分类
        let category = '未知';
        for (let cat in bookmarkData.categories) {
          if (bookmarkData.categories[cat].some(b => b.url === bookmark.url)) {
            category = cat;
            break;
          }
        }
        if (category === '未知' && bookmarkData.archives.some(b => b.url === bookmark.url)) {
          category = '归档';
        }
        
        // 转义CSV中的特殊字符
        const escapedTitle = bookmark.title.replace(/\"/g, '""');
        exportData += `"${escapedTitle}","${bookmark.url}","${category}","${new Date(bookmark.dateAdded).toLocaleString()}"\n`;
      });
      fileName = 'bookmarks_' + new Date().toISOString().slice(0, 10) + '.csv';
      mimeType = 'text/csv';
    } else if (format === 'html') {
      // HTML格式（兼容浏览器导入）
      exportData = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n
<TITLE>Bookmarks</TITLE>\n
<H1>Bookmarks</H1>\n
<DL><p>\n`;
      
      // 按分类组织书签
      for (let category in bookmarkData.categories) {
        if (bookmarkData.categories[category].length > 0) {
          exportData += `\t<DT><H3>${category}</H3>\n\t<DL><p>\n`;
          bookmarkData.categories[category].forEach(bookmark => {
            const date = Math.floor(new Date(bookmark.dateAdded).getTime() / 1000);
            exportData += `\t\t<DT><A HREF="${bookmark.url}" ADD_DATE="${date}">${bookmark.title}</A>\n`;
          });
          exportData += `\t</DL><p>\n`;
        }
      }
      
      // 添加归档分类
      if (bookmarkData.archives.length > 0) {
        exportData += `\t<DT><H3>归档</H3>\n\t<DL><p>\n`;
        bookmarkData.archives.forEach(bookmark => {
          const date = Math.floor(new Date(bookmark.dateAdded).getTime() / 1000);
          exportData += `\t\t<DT><A HREF="${bookmark.url}" ADD_DATE="${date}">${bookmark.title}</A>\n`;
        });
        exportData += `\t</DL><p>\n`;
      }
      
      exportData += `</DL><p>`;
      fileName = 'bookmarks_' + new Date().toISOString().slice(0, 10) + '.html';
      mimeType = 'text/html';
    } else {
      sendResponse({status: 'error', message: '不支持的导出格式'});
      return;
    }
    
    // 创建下载
    const blob = new Blob([exportData], {type: mimeType});
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: fileName,
      saveAs: true
    }, function(downloadId) {
      if (chrome.runtime.lastError) {
        console.error('下载出错：', chrome.runtime.lastError);
        sendResponse({status: 'error', message: chrome.runtime.lastError.message});
      } else {
        console.log('书签导出成功，下载ID：', downloadId);
        sendResponse({status: 'success', downloadId: downloadId});
      }
      
      // 释放URL对象
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });
}
