// background.js - 插件的后台脚本，负责处理书签数据和侧边栏的打开

// 当插件安装或更新时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('书签管家插件已安装');
  
  // 初始化存储空间，用于保存插件的书签数据
  chrome.storage.local.get(['bookmarkData'], function(result) {
    if (!result.bookmarkData) {
      // 如果没有保存的数据，则初始化一个空的数据结构
      chrome.storage.local.set({
        bookmarkData: {
          categories: {
            '未分类': [],
            '工作': [],
            '学习': [],
            '娱乐': [],
            '购物': [],
            '社交': [],
            '新闻': [],
            '技术': [],
            '其他': []
          },
          archives: [],
          lastUpdate: new Date().toISOString()
        }
      }, function() {
        console.log('书签数据已初始化');
        // 初始化后，同步一次书签数据
        syncBookmarks();
      });
    } else {
      // 已有数据，也同步一次以确保最新的书签被导入
      syncBookmarks();
    }
  });
  
  // 注册侧边栏
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
  
  // 创建定期同步的闹钟（每小时同步一次）
  chrome.alarms.create('syncBookmarks', { periodInMinutes: 60 });
});

// 当用户点击插件图标时，打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// 处理定期同步闹钟
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncBookmarks') {
    console.log('执行定期书签同步');
    syncBookmarks();
  }
});

// 从Chrome书签API获取所有书签并进行分类
function syncBookmarks() {
  chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    // 获取所有书签
    let allBookmarks = extractBookmarks(bookmarkTreeNodes);
    
    // 获取当前保存的分类数据
    chrome.storage.local.get(['bookmarkData'], function(result) {
      let bookmarkData = result.bookmarkData || {
        categories: {
          '未分类': [],
          '工作': [],
          '学习': [],
          '娱乐': [],
          '购物': [],
          '社交': [],
          '新闻': [],
          '技术': [],
          '其他': []
        },
        archives: [],
        lastUpdate: new Date().toISOString()
      };
      
      // 对新的书签进行自动分类
      let newBookmarks = allBookmarks.filter(bookmark => {
        // 检查书签是否已经在我们的数据中
        let existsInCategories = Object.values(bookmarkData.categories).some(
          category => category.some(b => b.url === bookmark.url)
        );
        let existsInArchives = bookmarkData.archives.some(b => b.url === bookmark.url);
        return !existsInCategories && !existsInArchives;
      });
      
      // 对新书签进行自动分类
      newBookmarks.forEach(bookmark => {
        let category = autoClassifyBookmark(bookmark);
        bookmarkData.categories[category].push(bookmark);
      });
      
      // 更新最后同步时间
      bookmarkData.lastUpdate = new Date().toISOString();
      
      // 保存更新后的数据
      chrome.storage.local.set({ bookmarkData }, function() {
        console.log('书签数据已更新');
      });
    });
  });
}

// 从书签树中提取所有书签
function extractBookmarks(bookmarkNodes) {
  let bookmarks = [];
  
  function traverse(nodes) {
    for (let node of nodes) {
      if (node.url) {
        // 这是一个书签
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url,
          dateAdded: node.dateAdded
        });
      }
      
      if (node.children) {
        // 这是一个文件夹，递归遍历其子节点
        traverse(node.children);
      }
    }
  }
  
  traverse(bookmarkNodes);
  return bookmarks;
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
  
  // 如果没有匹配到任何分类，则归为"未分类"
  return '未分类';
}

// 监听来自弹出窗口或侧边栏的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'syncBookmarks') {
    syncBookmarks();
    sendResponse({status: 'success'});
  } else if (request.action === 'getBookmarkData') {
    chrome.storage.local.get(['bookmarkData'], function(result) {
      sendResponse({data: result.bookmarkData});
    });
    return true; // 保持消息通道打开，以便异步发送响应
  } else if (request.action === 'updateBookmarkData') {
    chrome.storage.local.set({bookmarkData: request.data}, function() {
      sendResponse({status: 'success'});
    });
    return true;
  }
});
