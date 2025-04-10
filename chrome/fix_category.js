// 修复新创建的分类需要重启才能使用的问题
// 在addNewCategory函数中添加以下代码：

// 手动设置分类选择器的值，确保立即生效
categorySelect.value = categoryName;

// 清空新分类输入框
document.getElementById('new-category-name').value = '';
