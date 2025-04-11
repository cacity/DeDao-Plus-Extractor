// popup.js - 弹出窗口的交互逻辑

// 当弹出窗口加载完成时执行
console.log('弹出窗口脚本开始加载');
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载完成');
  // 获取DOM元素
  const totalBookmarksElement = document.getElementById('total-bookmarks');
  const totalCategoriesElement = document.getElementById('total-categories');
  const archivedBookmarksElement = document.getElementById('archived-bookmarks');
  const lastSyncElement = document.getElementById('last-sync');
  const categoryListElement = document.getElementById('category-list');
  const openSidebarButton = document.getElementById('open-sidebar');
  const syncBookmarksButton = document.getElementById('sync-bookmarks');
  const exportBookmarksButton = document.getElementById('export-bookmarks');
  const settingsButton = document.getElementById('settings-button');
  
  // 加载书签数据并更新界面
  loadBookmarkData();
  
  // 按钮点击事件处理
  openSidebarButton.addEventListener('click', function() {
    // 打开侧边栏
    if (chrome.sidePanel) {
      chrome.sidePanel.open();
    }
    // 关闭弹出窗口
    window.close();
  });
  
  syncBookmarksButton.addEventListener('click', function() {
    // 显示同步中状态
    syncBookmarksButton.textContent = '同步中...';
    syncBookmarksButton.disabled = true;
    
    // 发送消息给后台脚本，请求同步书签
    chrome.runtime.sendMessage({action: 'syncBookmarks'}, function(response) {
      if (response && response.status === 'success') {
        // 同步成功，重新加载数据
        loadBookmarkData();
        // 恢复按钮状态
        setTimeout(() => {
          syncBookmarksButton.textContent = '同步书签数据';
          syncBookmarksButton.disabled = false;
        }, 1000);
      }
    });
  });
  
  console.log('导出按钮已绑定点击事件');
  exportBookmarksButton.addEventListener('click', function() {
    console.log('导出按钮被点击');
    
    // 直接尝试导出 HTML 格式的书签，简化测试
    alert('正在尝试导出书签，请查看控制台日志');
    
    // 显示导出中状态
    exportBookmarksButton.textContent = '导出中...';
    exportBookmarksButton.disabled = true;
    
    // 发送消息给后台脚本，请求导出书签
    console.log('发送导出书签请求，格式：html');
    chrome.runtime.sendMessage({action: 'exportBookmarks', format: 'html'}, function(response) {
      console.log('收到导出响应：', response);
      if (response && response.status === 'success') {
        // 导出成功
        console.log('导出成功，下载ID：', response.downloadId);
        alert('导出成功！');
      } else {
        // 导出失败
        console.error('导出失败：', response ? response.message : '未知错误');
        alert('导出失败：' + (response ? response.message : '未知错误'));
      }
      
      // 恢复按钮状态
      setTimeout(() => {
        exportBookmarksButton.textContent = '导出书签';
        exportBookmarksButton.disabled = false;
      }, 1000);
    });
  });
  
  settingsButton.addEventListener('click', function() {
    // 这里可以打开设置页面或在弹出窗口中显示设置选项
    alert('设置功能将在未来版本中推出');
  });
  
  // 加载书签数据并更新界面
  function loadBookmarkData() {
    chrome.runtime.sendMessage({action: 'getBookmarkData'}, function(response) {
      if (response && response.data) {
        updateStats(response.data);
        updateCategoryList(response.data);
        updateLastSync(response.data.lastUpdate);
      }
    });
  }
  
  // 更新统计数据
  function updateStats(data) {
    let totalBookmarks = 0;
    
    // 计算所有分类中的书签总数
    for (let category in data.categories) {
      totalBookmarks += data.categories[category].length;
    }
    
    // 更新界面元素
    totalBookmarksElement.textContent = totalBookmarks;
    totalCategoriesElement.textContent = Object.keys(data.categories).length;
    archivedBookmarksElement.textContent = data.archives.length;
  }
  
  // 更新分类列表
  function updateCategoryList(data) {
    // 清空现有列表
    categoryListElement.innerHTML = '';
    
    // 按书签数量排序分类
    const sortedCategories = Object.entries(data.categories)
      .sort((a, b) => b[1].length - a[1].length);
    
    // 只显示前5个分类
    const topCategories = sortedCategories.slice(0, 5);
    
    // 创建分类列表项
    topCategories.forEach(([category, bookmarks]) => {
      if (bookmarks.length > 0) {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
          <span class="category-name">${category}</span>
          <span class="category-count">${bookmarks.length}</span>
        `;
        
        // 点击分类时，打开侧边栏并选中该分类
        categoryItem.addEventListener('click', function() {
          // 保存当前选中的分类，以便侧边栏打开时可以显示
          chrome.storage.local.set({selectedCategory: category}, function() {
            // 打开侧边栏
            if (chrome.sidePanel) {
              chrome.sidePanel.open();
            }
            // 关闭弹出窗口
            window.close();
          });
        });
        
        categoryListElement.appendChild(categoryItem);
      }
    });
    
    // 如果没有书签，显示提示信息
    if (topCategories.length === 0 || topCategories.every(([_, bookmarks]) => bookmarks.length === 0)) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = '暂无书签数据，请点击"同步书签数据"按钮';
      categoryListElement.appendChild(emptyMessage);
    }
  }
  
  // 更新最后同步时间
  function updateLastSync(lastUpdate) {
    if (lastUpdate) {
      // 格式化日期时间
      const date = new Date(lastUpdate);
      const formattedDate = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
      lastSyncElement.textContent = formattedDate;
    } else {
      lastSyncElement.textContent = '从未';
    }
  }
  
  // 辅助函数：补零
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }
});
