// popup.js - 弹出窗口的交互逻辑

// 当弹出窗口加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取打开侧边栏按钮
  const openSidebarButton = document.getElementById('open-sidebar');
  
  // 添加点击事件监听器
  openSidebarButton.addEventListener('click', function() {
    // 打开侧边栏
    chrome.sidePanel.open();
    // 关闭弹出窗口
    window.close();
  });
});
