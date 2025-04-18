// background.js - 后台脚本

// 存储活动标签页ID和内容脚本状态
let activeTabId = null;
let contentScriptStatus = {};

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(function() {
  console.log('得到内容提取器已安装');
  
  // 设置默认的CSS选择器
  chrome.storage.local.set({ 
    lastCssSelector: '.article-body',
    lastTitleSelector: '.article-title.iget-common-c1'
  });
});

// 监听标签页激活事件
chrome.tabs.onActivated.addListener(function(activeInfo) {
  activeTabId = activeInfo.tabId;
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    // 当页面加载完成时，重置内容脚本状态
    contentScriptStatus[tabId] = false;
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'contentScriptReady') {
    // 标记内容脚本已准备就绪
    if (sender.tab && sender.tab.id) {
      contentScriptStatus[sender.tab.id] = true;
      console.log('内容脚本已就绪，标签页ID:', sender.tab.id);
    }
    return true;
  }
  
  // 处理摘要生成API请求
  if (message.action === 'fetchSummary') {
    console.log('收到摘要生成请求:', message.url);
    console.log('请求头部:', JSON.stringify(message.headers));
    console.log('请求体:', JSON.stringify(message.body, null, 2));
    
    // 尝试发送API请求
    try {
      fetch(message.url, {
        method: 'POST',
        headers: message.headers,
        body: JSON.stringify(message.body)
      })
    .then(response => {
      console.log('API响应状态:', response.status);
      if (!response.ok) {
        return response.text().then(text => {
          console.error('API错误响应:', text);
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('API响应数据:', data);
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error('API调用错误:', error);
      let errorMessage = error.message;
      
      // 根据错误类型提供更有用的错误信息
      if (errorMessage.includes('404')) {
        errorMessage = 'API端点不存在，请检查Base URL是否正确。';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'API认证失败，请检查API Key是否正确。';
      } else if (errorMessage.includes('429')) {
        errorMessage = 'API请求过多，请稍后再试。';
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = '无法连接到API服务器。请检查您的网络连接和API配置。如果您使用的是火山引擎或OpenAI，请确保URL和API Key正确。';
      }
      
      sendResponse({ success: false, error: errorMessage });
    });
    } catch (error) {
      console.error('发送请求时出错:', error);
      sendResponse({ 
        success: false, 
        error: '发送请求时出错: ' + error.message 
      });
    }
    
    return true; // 异步响应
  }
});

// 监听侧边栏打开事件
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// 提供给侧边栏的方法，检查内容脚本是否就绪
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'checkContentScriptStatus') {
    // 获取当前活动标签页ID
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        const tabId = tabs[0].id;
        const isReady = contentScriptStatus[tabId] || false;
        
        if (!isReady) {
          // 如果内容脚本未就绪，尝试注入
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
          }).then(() => {
            console.log('内容脚本已注入到标签页:', tabId);
            // 给脚本一点时间加载
            setTimeout(() => {
              sendResponse({ isReady: true, injected: true });
            }, 500);
          }).catch(error => {
            console.error('注入脚本失败:', error);
            sendResponse({ isReady: false, error: error.message });
          });
          
          return true; // 异步响应
        }
        
        sendResponse({ isReady: isReady });
      } else {
        sendResponse({ isReady: false, error: '无法获取当前标签页' });
      }
    });
    
    return true; // 异步响应
  }
});
