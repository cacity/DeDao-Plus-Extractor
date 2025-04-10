// sidebar.js - 侧边栏的交互逻辑

// 当侧边栏加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const categorySelect = document.getElementById('category-select');
  const addCategoryButton = document.getElementById('add-category-button');
  const categoryBookmarksList = document.getElementById('category-bookmarks');
  const archiveBookmarksList = document.getElementById('archive-bookmarks');
  const categorySelectAllButton = document.getElementById('category-select-all');
  const archiveSelectAllButton = document.getElementById('archive-select-all');
  const moveToArchiveButton = document.getElementById('move-to-archive');
  const deleteFromCategoryButton = document.getElementById('delete-from-category');
  const moveToCategoryButton = document.getElementById('move-to-category');
  const restoreFromArchiveButton = document.getElementById('restore-from-archive');
  const deleteFromArchiveButton = document.getElementById('delete-from-archive');
  const autoClassifyAllButton = document.getElementById('auto-classify-all');
  const autoArchiveButton = document.getElementById('auto-archive');
  const archiveTimeSelect = document.getElementById('archive-time-select');
  const deleteDuplicatesCheckbox = document.getElementById('delete-duplicates');
  const deleteBrokenCheckbox = document.getElementById('delete-broken');
  const batchDeleteButton = document.getElementById('batch-delete');
  const lastSyncTimeElement = document.getElementById('last-sync-time');
  const syncNowButton = document.getElementById('sync-now');
  
  // 模态框元素
  const addCategoryModal = document.getElementById('add-category-modal');
  const moveToCategoryModal = document.getElementById('move-to-category-modal');
  const closeButtons = document.querySelectorAll('.close-button');
  const newCategoryNameInput = document.getElementById('new-category-name');
  const confirmAddCategoryButton = document.getElementById('confirm-add-category');
  const targetCategorySelect = document.getElementById('target-category-select');
  const confirmMoveButton = document.getElementById('confirm-move');
  
  // 全局变量
  let bookmarkData = null;
  let currentCategory = '未分类';
  let selectedBookmarks = {
    category: [],
    archive: []
  };
  
  // 初始化
  loadBookmarkData();
  
  // 标签页切换
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // 更新标签按钮状态
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // 更新标签内容状态
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // 搜索功能
  searchButton.addEventListener('click', function() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
      searchBookmarks(searchTerm);
    }
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const searchTerm = searchInput.value.trim().toLowerCase();
      if (searchTerm) {
        searchBookmarks(searchTerm);
      }
    }
  });
  
  // 分类选择
  categorySelect.addEventListener('change', function() {
    currentCategory = this.value;
    renderCategoryBookmarks();
  });
  
  // 添加分类按钮
  addCategoryButton.addEventListener('click', function() {
    addCategoryModal.style.display = 'block';
    newCategoryNameInput.focus();
  });
  
  // 确认添加分类
  confirmAddCategoryButton.addEventListener('click', function() {
    const newCategoryName = newCategoryNameInput.value.trim();
    if (newCategoryName) {
      addNewCategory(newCategoryName);
      addCategoryModal.style.display = 'none';
      newCategoryNameInput.value = '';
    }
  });
  
  // 移动到归档
  moveToArchiveButton.addEventListener('click', function() {
    if (selectedBookmarks.category.length > 0) {
      moveToArchive();
    } else {
      alert('请先选择要归档的书签');
    }
  });
  
  // 从分类中删除
  deleteFromCategoryButton.addEventListener('click', function() {
    if (selectedBookmarks.category.length > 0) {
      deleteFromCategory();
    } else {
      alert('请先选择要删除的书签');
    }
  });
  
  // 移动到其他分类
  moveToCategoryButton.addEventListener('click', function() {
    if (selectedBookmarks.category.length > 0) {
      // 更新目标分类选择器
      updateTargetCategorySelect();
      moveToCategoryModal.style.display = 'block';
    } else {
      alert('请先选择要移动的书签');
    }
  });
  
  // 确认移动到其他分类
  confirmMoveButton.addEventListener('click', function() {
    const targetCategory = targetCategorySelect.value;
    if (targetCategory) {
      // 检查是否是搜索结果中的书签
      if (selectedBookmarks.search && selectedBookmarks.search.length > 0) {
        handleSelectedSearchBookmarks('move', targetCategory);
      } else if (targetCategory !== currentCategory) {
        moveToCategory(targetCategory);
      }
      moveToCategoryModal.style.display = 'none';
    }
  });
  
  // 从归档中恢复
  restoreFromArchiveButton.addEventListener('click', function() {
    if (selectedBookmarks.archive.length > 0) {
      restoreFromArchive();
    } else {
      alert('请先选择要恢复的书签');
    }
  });
  
  // 从归档中删除
  deleteFromArchiveButton.addEventListener('click', function() {
    if (selectedBookmarks.archive.length > 0) {
      deleteFromArchive();
    } else {
      alert('请先选择要删除的书签');
    }
  });
  
  // 分类书签全选按钮
  categorySelectAllButton.addEventListener('click', function() {
    // 全选或取消全选
    const allCheckboxes = categoryBookmarksList.querySelectorAll('.bookmark-checkbox');
    const isAllSelected = selectedBookmarks.category && 
                         selectedBookmarks.category.length === bookmarkData.categories[currentCategory].length;
    
    // 重置选中状态
    selectedBookmarks.category = [];
    
    allCheckboxes.forEach((checkbox, index) => {
      if (!isAllSelected) {
        // 全选
        checkbox.checked = true;
        selectedBookmarks.category.push(index);
      } else {
        // 取消全选
        checkbox.checked = false;
      }
    });
    
    // 更新按钮文本
    this.textContent = isAllSelected ? '全选' : '取消全选';
  });
  
  // 归档书签全选按钮
  archiveSelectAllButton.addEventListener('click', function() {
    // 全选或取消全选
    const allCheckboxes = archiveBookmarksList.querySelectorAll('.bookmark-checkbox');
    const isAllSelected = selectedBookmarks.archive && 
                         selectedBookmarks.archive.length === bookmarkData.archives.length;
    
    // 重置选中状态
    selectedBookmarks.archive = [];
    
    allCheckboxes.forEach((checkbox, index) => {
      if (!isAllSelected) {
        // 全选
        checkbox.checked = true;
        selectedBookmarks.archive.push(index);
      } else {
        // 取消全选
        checkbox.checked = false;
      }
    });
    
    // 更新按钮文本
    this.textContent = isAllSelected ? '全选' : '取消全选';
  });
  
  // 自动分类所有未分类书签
  autoClassifyAllButton.addEventListener('click', function() {
    autoClassifyAll();
  });
  
  // 批量归档
  autoArchiveButton.addEventListener('click', function() {
    const days = parseInt(archiveTimeSelect.value);
    autoArchiveByTime(days);
  });
  
  // 批量删除
  batchDeleteButton.addEventListener('click', function() {
    const deleteDuplicates = deleteDuplicatesCheckbox.checked;
    const deleteBroken = deleteBrokenCheckbox.checked;
    
    if (deleteDuplicates || deleteBroken) {
      batchDelete(deleteDuplicates, deleteBroken);
    } else {
      alert('请选择至少一种删除条件');
    }
  });
  
  // 立即同步
  syncNowButton.addEventListener('click', function() {
    syncNowButton.textContent = '同步中...';
    syncNowButton.disabled = true;
    
    chrome.runtime.sendMessage({action: 'syncBookmarks'}, function(response) {
      if (response && response.status === 'success') {
        loadBookmarkData();
        setTimeout(() => {
          syncNowButton.textContent = '立即同步';
          syncNowButton.disabled = false;
        }, 1000);
      }
    });
  });
  
  // 关闭模态框
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      addCategoryModal.style.display = 'none';
      moveToCategoryModal.style.display = 'none';
    });
  });
  
  // 点击模态框外部关闭
  window.addEventListener('click', function(event) {
    if (event.target === addCategoryModal) {
      addCategoryModal.style.display = 'none';
    }
    if (event.target === moveToCategoryModal) {
      moveToCategoryModal.style.display = 'none';
    }
  });
  
  // 加载书签数据
  function loadBookmarkData() {
    chrome.runtime.sendMessage({action: 'getBookmarkData'}, function(response) {
      if (response && response.data) {
        bookmarkData = response.data;
        
        // 检查是否有选中的分类（从弹出窗口传递过来）
        chrome.storage.local.get(['selectedCategory'], function(result) {
          if (result.selectedCategory && bookmarkData.categories[result.selectedCategory]) {
            currentCategory = result.selectedCategory;
            // 清除选中的分类，以便下次打开时不会自动选中
            chrome.storage.local.remove(['selectedCategory']);
          }
          
          // 更新界面
          updateCategorySelect();
          renderCategoryBookmarks();
          renderArchiveBookmarks();
          updateLastSyncTime();
        });
      }
    });
  }
  
  // 更新分类选择器
  function updateCategorySelect() {
    categorySelect.innerHTML = '';
    
    for (let category in bookmarkData.categories) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = `${category} (${bookmarkData.categories[category].length})`;
      
      if (category === currentCategory) {
        option.selected = true;
      }
      
      categorySelect.appendChild(option);
    }
  }
  
  // 更新目标分类选择器（移动书签时使用）
  function updateTargetCategorySelect() {
    targetCategorySelect.innerHTML = '';
    
    for (let category in bookmarkData.categories) {
      if (category !== currentCategory) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        targetCategorySelect.appendChild(option);
      }
    }
  }
  
  // 渲染当前分类的书签
  function renderCategoryBookmarks() {
    categoryBookmarksList.innerHTML = '';
    selectedBookmarks.category = [];
    
    const bookmarks = bookmarkData.categories[currentCategory] || [];
    
    if (bookmarks.length === 0) {
      // 显示空状态
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>当前分类没有书签</p>
        <button id="sync-empty-category">同步书签数据</button>
      `;
      categoryBookmarksList.appendChild(emptyState);
      
      // 绑定同步按钮事件
      document.getElementById('sync-empty-category').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: 'syncBookmarks'}, function(response) {
          if (response && response.status === 'success') {
            loadBookmarkData();
          }
        });
      });
      
      return;
    }
    
    // 渲染书签列表
    bookmarks.forEach((bookmark, index) => {
      const bookmarkItem = createBookmarkItem(bookmark, index, 'category');
      categoryBookmarksList.appendChild(bookmarkItem);
    });
  }
  
  // 创建书签项
  function createBookmarkItem(bookmark, index, type) {
    const bookmarkItem = document.createElement('div');
    bookmarkItem.className = 'bookmark-item';
    bookmarkItem.dataset.index = index;
    
    // 创建复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'bookmark-checkbox';
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        // 添加到选中列表
        selectedBookmarks[type].push(index);
      } else {
        // 从选中列表中移除
        const selectedIndex = selectedBookmarks[type].indexOf(index);
        if (selectedIndex !== -1) {
          selectedBookmarks[type].splice(selectedIndex, 1);
        }
      }
    });
    
    // 创建网站图标
    const favicon = document.createElement('img');
    favicon.className = 'bookmark-favicon';
    favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}`;
    favicon.onerror = function() {
      this.src = 'images/icon16.png'; // 加载失败时使用默认图标
    };
    
    // 创建书签信息容器
    const bookmarkInfo = document.createElement('div');
    bookmarkInfo.className = 'bookmark-info';
    
    // 创建书签标题
    const bookmarkTitle = document.createElement('div');
    bookmarkTitle.className = 'bookmark-title';
    bookmarkTitle.textContent = bookmark.title || '无标题';
    
    // 创建书签URL
    const bookmarkUrl = document.createElement('div');
    bookmarkUrl.className = 'bookmark-url';
    bookmarkUrl.textContent = bookmark.url;
    
    // 创建操作按钮容器
    const bookmarkActions = document.createElement('div');
    bookmarkActions.className = 'bookmark-actions';
    
    // 创建打开按钮
    const openButton = document.createElement('button');
    openButton.className = 'bookmark-action-button';
    openButton.textContent = '打开';
    openButton.addEventListener('click', function() {
      chrome.tabs.create({ url: bookmark.url });
    });
    
    // 组装书签项
    bookmarkInfo.appendChild(bookmarkTitle);
    bookmarkInfo.appendChild(bookmarkUrl);
    
    bookmarkActions.appendChild(openButton);
    
    bookmarkItem.appendChild(checkbox);
    bookmarkItem.appendChild(favicon);
    bookmarkItem.appendChild(bookmarkInfo);
    bookmarkItem.appendChild(bookmarkActions);
    
    return bookmarkItem;
  }
  
  // 渲染归档书签
  function renderArchiveBookmarks() {
    archiveBookmarksList.innerHTML = '';
    selectedBookmarks.archive = [];
    
    const bookmarks = bookmarkData.archives || [];
    
    if (bookmarks.length === 0) {
      // 显示空状态
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>归档中没有书签</p>
      `;
      archiveBookmarksList.appendChild(emptyState);
      return;
    }
    
    // 渲染书签列表
    bookmarks.forEach((bookmark, index) => {
      const bookmarkItem = createBookmarkItem(bookmark, index, 'archive');
      archiveBookmarksList.appendChild(bookmarkItem);
    });
  }
  
  // 更新最后同步时间
  function updateLastSyncTime() {
    if (bookmarkData && bookmarkData.lastUpdate) {
      // 格式化日期时间
      const date = new Date(bookmarkData.lastUpdate);
      const formattedDate = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
      lastSyncTimeElement.textContent = formattedDate;
    } else {
      lastSyncTimeElement.textContent = '从未';
    }
  }
  
  // 辅助函数：补零
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }
  
  // 移动书签到归档
  function moveToArchive() {
    if (selectedBookmarks.category.length === 0) return;
    
    // 获取选中的书签
    const selectedIndices = [...selectedBookmarks.category].sort((a, b) => b - a); // 从大到小排序，以便从后往前删除
    
    // 移动书签到归档
    selectedIndices.forEach(index => {
      const bookmark = bookmarkData.categories[currentCategory][index];
      bookmarkData.archives.push(bookmark);
      bookmarkData.categories[currentCategory].splice(index, 1);
    });
    
    // 更新存储
    updateBookmarkData();
    
    // 清空选中列表
    selectedBookmarks.category = [];
    
    // 重新渲染
    renderCategoryBookmarks();
  }
  
  // 从分类中删除书签
  function deleteFromCategory() {
    if (selectedBookmarks.category.length === 0) return;
    
    if (confirm('确定要删除选中的书签吗？')) {
      // 获取选中的书签
      const selectedIndices = [...selectedBookmarks.category].sort((a, b) => b - a); // 从大到小排序，以便从后往前删除
      
      // 删除书签
      selectedIndices.forEach(index => {
        bookmarkData.categories[currentCategory].splice(index, 1);
      });
      
      // 更新存储
      updateBookmarkData();
      
      // 清空选中列表
      selectedBookmarks.category = [];
      
      // 重新渲染
      renderCategoryBookmarks();
    }
  }
  
  // 移动书签到其他分类
  function moveToCategory(targetCategory) {
    if (selectedBookmarks.category.length === 0 || !targetCategory) return;
    
    // 获取选中的书签
    const selectedIndices = [...selectedBookmarks.category].sort((a, b) => b - a); // 从大到小排序，以便从后往前删除
    
    // 移动书签到目标分类
    selectedIndices.forEach(index => {
      const bookmark = bookmarkData.categories[currentCategory][index];
      bookmarkData.categories[targetCategory].push(bookmark);
      bookmarkData.categories[currentCategory].splice(index, 1);
    });
    
    // 更新存储
    updateBookmarkData();
    
    // 清空选中列表
    selectedBookmarks.category = [];
    
    // 重新渲染
    renderCategoryBookmarks();
  }
  
  // 从归档中恢复书签
  function restoreFromArchive() {
    if (selectedBookmarks.archive.length === 0) return;
    
    // 获取选中的书签
    const selectedIndices = [...selectedBookmarks.archive].sort((a, b) => b - a); // 从大到小排序，以便从后往前删除
    
    // 恢复书签到未分类
    selectedIndices.forEach(index => {
      const bookmark = bookmarkData.archives[index];
      bookmarkData.categories['未分类'].push(bookmark);
      bookmarkData.archives.splice(index, 1);
    });
    
    // 更新存储
    updateBookmarkData();
    
    // 清空选中列表
    selectedBookmarks.archive = [];
    
    // 重新渲染
    renderArchiveBookmarks();
  }
  
  // 从归档中删除书签
  function deleteFromArchive() {
    if (selectedBookmarks.archive.length === 0) return;
    
    if (confirm('确定要删除选中的书签吗？')) {
      // 获取选中的书签
      const selectedIndices = [...selectedBookmarks.archive].sort((a, b) => b - a); // 从大到小排序，以便从后往前删除
      
      // 删除书签
      selectedIndices.forEach(index => {
        bookmarkData.archives.splice(index, 1);
      });
      
      // 更新存储
      updateBookmarkData();
      
      // 清空选中列表
      selectedBookmarks.archive = [];
      
      // 重新渲染
      renderArchiveBookmarks();
    }
  }
  
  // 更新书签数据到存储
  function updateBookmarkData() {
    // 更新最后同步时间
    bookmarkData.lastUpdate = new Date().toISOString();
    
    // 保存到存储
    chrome.storage.local.set({ bookmarkData }, function() {
      console.log('书签数据已更新');
    });
  }
  
  // 自动分类所有未分类书签
  function autoClassifyAll() {
    if (!bookmarkData.categories['未分类'] || bookmarkData.categories['未分类'].length === 0) {
      alert('没有未分类的书签需要处理');
      return;
    }
    
    // 复制一份未分类书签
    const unclassifiedBookmarks = [...bookmarkData.categories['未分类']];
    // 清空未分类列表
    bookmarkData.categories['未分类'] = [];
    
    // 对每个书签进行自动分类
    unclassifiedBookmarks.forEach(bookmark => {
      const category = autoClassifyBookmark(bookmark);
      bookmarkData.categories[category].push(bookmark);
    });
    
    // 更新存储
    updateBookmarkData();
    
    // 更新界面
    updateCategorySelect();
    renderCategoryBookmarks();
    
    // 显示成功消息
    alert('自动分类完成！');
  }
  
  // 根据URL和标题自动分类书签
  function autoClassifyBookmark(bookmark) {
    const url = bookmark.url.toLowerCase();
    const title = bookmark.title.toLowerCase();
    
    // 定义关键词与分类的映射
    const categoryKeywords = {
      '工作': ['work', 'office', 'job', 'career', 'linkedin', 'resume', '工作', '办公', '职场'],
      '学习': ['learn', 'course', 'study', 'education', 'tutorial', 'documentation', '学习', '教程', '课程'],
      '娱乐': ['game', 'movie', 'music', 'video', 'youtube', 'netflix', 'bilibili', '游戏', '电影', '音乐'],
      '购物': ['shop', 'buy', 'store', 'mall', 'amazon', 'taobao', 'jd', '购物', '商城'],
      '社交': ['social', 'chat', 'message', 'facebook', 'twitter', 'instagram', 'weibo', 'wechat', '社交', '聊天'],
      '新闻': ['news', 'media', 'report', 'cnn', 'bbc', '新闻', '媒体', '报道'],
      '技术': ['tech', 'code', 'program', 'develop', 'github', 'stack overflow', '技术', '编程', '开发']
    };
    
    // 检查URL和标题是否包含特定关键词
    for (let category in categoryKeywords) {
      for (let keyword of categoryKeywords[category]) {
        if (url.includes(keyword) || title.includes(keyword)) {
          return category;
        }
      }
    }
    
    // 如果没有匹配到任何分类，则归为“其他”
    return '其他';
  }
  
  // 根据时间批量归档
  function autoArchiveByTime(days) {
    if (!days || days <= 0) return;
    
    // 计算时间阈值
    const now = new Date();
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // 记录需要归档的书签
    let archivedCount = 0;
    
    // 遍历所有分类
    for (let category in bookmarkData.categories) {
      // 找出需要归档的书签
      const toArchive = [];
      const toKeep = [];
      
      bookmarkData.categories[category].forEach(bookmark => {
        // 如果书签有dateAdded属性且早于阈值时间，则归档
        if (bookmark.dateAdded && new Date(bookmark.dateAdded) < threshold) {
          toArchive.push(bookmark);
          archivedCount++;
        } else {
          toKeep.push(bookmark);
        }
      });
      
      // 更新分类中的书签
      bookmarkData.categories[category] = toKeep;
      
      // 添加到归档
      bookmarkData.archives = bookmarkData.archives.concat(toArchive);
    }
    
    // 更新存储
    updateBookmarkData();
    
    // 更新界面
    if (currentCategory) {
      renderCategoryBookmarks();
    }
    renderArchiveBookmarks();
    
    // 显示成功消息
    alert(`批量归档完成！共归档了 ${archivedCount} 个书签。`);
  }
  
  // 批量删除操作
  function batchDelete(deleteDuplicates, deleteBroken) {
    if (!deleteDuplicates && !deleteBroken) return;
    
    let deletedCount = 0;
    
    // 删除重复书签
    if (deleteDuplicates) {
      // 创建一个集合来跟踪已经处理过的URL
      const processedUrls = new Set();
      
      // 遍历所有分类
      for (let category in bookmarkData.categories) {
        const uniqueBookmarks = [];
        
        bookmarkData.categories[category].forEach(bookmark => {
          if (!processedUrls.has(bookmark.url)) {
            // 如果这个URL还没有处理过，则保留这个书签
            uniqueBookmarks.push(bookmark);
            processedUrls.add(bookmark.url);
          } else {
            // 如果这个URL已经处理过，则认为是重复的，删除
            deletedCount++;
          }
        });
        
        // 更新分类中的书签
        bookmarkData.categories[category] = uniqueBookmarks;
      }
      
      // 对归档也进行同样的处理
      const uniqueArchives = [];
      bookmarkData.archives.forEach(bookmark => {
        if (!processedUrls.has(bookmark.url)) {
          uniqueArchives.push(bookmark);
          processedUrls.add(bookmark.url);
        } else {
          deletedCount++;
        }
      });
      bookmarkData.archives = uniqueArchives;
    }
    
    // 删除失效链接
    // 注意：这里只是模拟删除失效链接，实际上需要使用fetch或其他方式检查URL是否可访问
    // 由于浏览器扩展的安全限制，这里简化处理
    if (deleteBroken) {
      // 这里只是模拟删除一些可能失效的链接
      // 实际应用中需要实现真正的链接检查
      alert('检查失效链接功能将在后续版本中实现。');
    }
    
    // 更新存储
    updateBookmarkData();
    
    // 更新界面
    renderCategoryBookmarks();
    renderArchiveBookmarks();
    
    // 显示成功消息
    alert(`批量删除完成！共删除了 ${deletedCount} 个书签。`);
  }
  
  // 添加新分类
  function addNewCategory(categoryName) {
    // 检查分类名称是否已存在
    if (bookmarkData.categories[categoryName]) {
      alert(`分类“${categoryName}”已经存在！`);
      return false;
    }
    
    // 创建新分类
    bookmarkData.categories[categoryName] = [];
    
    // 更新存储
    updateBookmarkData();
    
    // 更新分类选择器
    updateCategorySelect();
    
    // 切换到新分类
    currentCategory = categoryName;
    renderCategoryBookmarks();
    
    // 显示成功消息
    alert(`分类“${categoryName}”添加成功！`);
    return true;
  }

  // 搜索书签
  function searchBookmarks(searchTerm) {
    if (!searchTerm) return;
    
    // 创建一个分类来存放搜索结果
    const searchResults = [];
    
    // 搜索所有分类中的书签
    for (let category in bookmarkData.categories) {
      bookmarkData.categories[category].forEach(bookmark => {
        if (bookmark.title.toLowerCase().includes(searchTerm) || 
            bookmark.url.toLowerCase().includes(searchTerm)) {
          searchResults.push(bookmark);
        }
      });
    }
    
    // 搜索归档中的书签
    bookmarkData.archives.forEach(bookmark => {
      if (bookmark.title.toLowerCase().includes(searchTerm) || 
          bookmark.url.toLowerCase().includes(searchTerm)) {
        searchResults.push(bookmark);
      }
    });
    
    // 显示搜索结果
    categoryBookmarksList.innerHTML = '';
    
    if (searchResults.length === 0) {
      // 显示空状态
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>没有找到匹配"${searchTerm}"的书签</p>
      `;
      categoryBookmarksList.appendChild(emptyState);
      return;
    }
    
    // 创建搜索结果操作按钮区域
    const searchActionsDiv = document.createElement('div');
    searchActionsDiv.className = 'search-actions';
    searchActionsDiv.innerHTML = `
      <div class="search-action-buttons">
        <button id="search-select-all">全选</button>
        <button id="search-move-to-category">移动到分类</button>
        <button id="search-archive">归档</button>
        <button id="search-delete">删除</button>
      </div>
    `;
    categoryBookmarksList.appendChild(searchActionsDiv);
    
    // 添加搜索结果操作按钮事件
    document.getElementById('search-select-all').addEventListener('click', function() {
      // 全选或取消全选
      const allCheckboxes = categoryBookmarksList.querySelectorAll('.bookmark-checkbox');
      const isAllSelected = selectedBookmarks.search && selectedBookmarks.search.length === searchResults.length;
      
      // 重置选中状态
      selectedBookmarks.search = [];
      
      allCheckboxes.forEach((checkbox, index) => {
        if (!isAllSelected) {
          // 全选
          checkbox.checked = true;
          selectedBookmarks.search.push(index);
        } else {
          // 取消全选
          checkbox.checked = false;
        }
      });
      
      // 更新按钮文本
      this.textContent = isAllSelected ? '全选' : '取消全选';
    });
    
    document.getElementById('search-move-to-category').addEventListener('click', function() {
      if (!selectedBookmarks.search || selectedBookmarks.search.length === 0) {
        alert('请先选择要移动的书签');
        return;
      }
      // 更新目标分类选择器
      updateTargetCategorySelect();
      moveToCategoryModal.style.display = 'block';
    });
    
    document.getElementById('search-archive').addEventListener('click', function() {
      if (!selectedBookmarks.search || selectedBookmarks.search.length === 0) {
        alert('请先选择要归档的书签');
        return;
      }
      handleSelectedSearchBookmarks('archive');
    });
    
    document.getElementById('search-delete').addEventListener('click', function() {
      if (!selectedBookmarks.search || selectedBookmarks.search.length === 0) {
        alert('请先选择要删除的书签');
        return;
      }
      if (confirm('确定要删除选中的书签吗？')) {
        handleSelectedSearchBookmarks('delete');
      }
    });
    
    // 渲染搜索结果
    searchResults.forEach((bookmark, index) => {
      const bookmarkItem = document.createElement('div');
      bookmarkItem.className = 'bookmark-item';
      bookmarkItem.dataset.index = index;
      
      // 创建复选框
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'bookmark-checkbox';
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          // 添加到选中列表
          selectedBookmarks['search'] = selectedBookmarks['search'] || [];
          selectedBookmarks['search'].push(index);
        } else {
          // 从选中列表中移除
          if (selectedBookmarks['search']) {
            const selectedIndex = selectedBookmarks['search'].indexOf(index);
            if (selectedIndex !== -1) {
              selectedBookmarks['search'].splice(selectedIndex, 1);
            }
          }
        }
      });
      
      // 创建网站图标
      const favicon = document.createElement('img');
      favicon.className = 'bookmark-favicon';
      favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}`;
      favicon.onerror = function() {
        this.src = 'images/icon16.png'; // 加载失败时使用默认图标
      };
      
      // 创建书签信息容器
      const bookmarkInfo = document.createElement('div');
      bookmarkInfo.className = 'bookmark-info';
      
      // 创建书签标题
      const bookmarkTitle = document.createElement('div');
      bookmarkTitle.className = 'bookmark-title';
      bookmarkTitle.textContent = bookmark.title || '无标题';
      
      // 创建书签URL
      const bookmarkUrl = document.createElement('div');
      bookmarkUrl.className = 'bookmark-url';
      bookmarkUrl.textContent = bookmark.url;
      
      // 创建操作按钮容器
      const bookmarkActions = document.createElement('div');
      bookmarkActions.className = 'bookmark-actions';
      
      // 创建打开按钮
      const openButton = document.createElement('button');
      openButton.className = 'bookmark-action-button';
      openButton.textContent = '打开';
      openButton.addEventListener('click', function() {
        chrome.tabs.create({ url: bookmark.url });
      });
      
      // 组装书签项
      bookmarkInfo.appendChild(bookmarkTitle);
      bookmarkInfo.appendChild(bookmarkUrl);
      
      bookmarkActions.appendChild(openButton);
      
      bookmarkItem.appendChild(checkbox);
      bookmarkItem.appendChild(favicon);
      bookmarkItem.appendChild(bookmarkInfo);
      bookmarkItem.appendChild(bookmarkActions);
      
      categoryBookmarksList.appendChild(bookmarkItem);
    });
  }
  
  // 处理搜索结果中选中的书签
  function handleSelectedSearchBookmarks(action, targetCategory) {
    if (!selectedBookmarks.search || selectedBookmarks.search.length === 0) {
      alert('请先选择要操作的书签！');
      return;
    }
    
    // 获取当前的搜索关键词
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (!searchTerm) return;
    
    const searchResults = [];
    // 收集搜索结果中的所有书签及其所在分类
    for (let category in bookmarkData.categories) {
      bookmarkData.categories[category].forEach(bookmark => {
        if (bookmark.title.toLowerCase().includes(searchTerm) || 
            bookmark.url.toLowerCase().includes(searchTerm)) {
          searchResults.push({
            bookmark,
            category,
            index: bookmarkData.categories[category].indexOf(bookmark)
          });
        }
      });
    }
    
    // 搜索归档中的书签
    bookmarkData.archives.forEach(bookmark => {
      if (bookmark.title.toLowerCase().includes(searchTerm) || 
          bookmark.url.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          bookmark,
          isArchive: true,
          index: bookmarkData.archives.indexOf(bookmark)
        });
      }
    });
    
    // 获取选中的书签
    const selectedItems = selectedBookmarks.search.map(index => searchResults[index]);
    
    // 根据不同的操作处理选中的书签
    switch(action) {
      case 'move':
        if (!targetCategory) {
          alert('请选择目标分类！');
          return;
        }
        
        // 先收集要移动的书签，按分类分组
        const bookmarksToMove = {};
        const archiveBookmarksToMove = [];
        
        selectedItems.forEach(item => {
          if (!item.isArchive) {
            // 如果来自分类，按分类分组
            if (!bookmarksToMove[item.category]) {
              bookmarksToMove[item.category] = [];
            }
            bookmarksToMove[item.category].push(item);
          } else {
            // 如果来自归档
            archiveBookmarksToMove.push(item);
          }
        });
        
        // 处理分类中的书签，按照索引从大到小删除，避免索引变化
        for (let category in bookmarksToMove) {
          // 按索引从大到小排序
          bookmarksToMove[category].sort((a, b) => b.index - a.index);
          
          // 从原分类中移除并添加到新分类
          bookmarksToMove[category].forEach(item => {
            // 从原分类中移除
            bookmarkData.categories[category].splice(item.index, 1);
            // 添加到新分类
            bookmarkData.categories[targetCategory].push(item.bookmark);
          });
        }
        
        // 处理归档中的书签，同样按索引从大到小删除
        archiveBookmarksToMove.sort((a, b) => b.index - a.index);
        archiveBookmarksToMove.forEach(item => {
          // 从归档中移除
          bookmarkData.archives.splice(item.index, 1);
          // 添加到目标分类
          bookmarkData.categories[targetCategory].push(item.bookmark);
        });
        alert(`成功移动 ${selectedItems.length} 个书签到分类 "${targetCategory}"`);
        break;
        
      case 'archive':
        // 先按分类分组要归档的书签
        const bookmarksToArchive = {};
        
        selectedItems.forEach(item => {
          if (!item.isArchive) { // 只处理非归档的书签
            if (!bookmarksToArchive[item.category]) {
              bookmarksToArchive[item.category] = [];
            }
            bookmarksToArchive[item.category].push(item);
          }
        });
        
        // 处理每个分类中的书签
        for (let category in bookmarksToArchive) {
          // 按索引从大到小排序
          bookmarksToArchive[category].sort((a, b) => b.index - a.index);
          
          // 从原分类中移除并添加到归档
          bookmarksToArchive[category].forEach(item => {
            // 从原分类中移除
            bookmarkData.categories[category].splice(item.index, 1);
            // 添加到归档
            bookmarkData.archives.push(item.bookmark);
          });
        }
        
        alert(`成功归档 ${selectedItems.length} 个书签`);
        break;
        
      case 'delete':
        // 先按分类分组要删除的书签
        const bookmarksToDelete = {};
        const archiveBookmarksToDelete = [];
        
        selectedItems.forEach(item => {
          if (!item.isArchive) {
            // 如果来自分类，按分类分组
            if (!bookmarksToDelete[item.category]) {
              bookmarksToDelete[item.category] = [];
            }
            bookmarksToDelete[item.category].push(item);
          } else {
            // 如果来自归档
            archiveBookmarksToDelete.push(item);
          }
        });
        
        // 处理分类中的书签
        for (let category in bookmarksToDelete) {
          // 按索引从大到小排序
          bookmarksToDelete[category].sort((a, b) => b.index - a.index);
          
          // 从原分类中删除
          bookmarksToDelete[category].forEach(item => {
            bookmarkData.categories[category].splice(item.index, 1);
          });
        }
        
        // 处理归档中的书签
        archiveBookmarksToDelete.sort((a, b) => b.index - a.index);
        archiveBookmarksToDelete.forEach(item => {
          bookmarkData.archives.splice(item.index, 1);
        });
        
        alert(`成功删除 ${selectedItems.length} 个书签`);
        break;
    }
    
    // 重置选中状态
    selectedBookmarks.search = [];
    
    // 更新存储和界面
    updateBookmarkData();
    searchBookmarks(searchTerm);
  }
});
