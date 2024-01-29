const setResponsivePadding = () => {
    // 确保只在客户端执行
    if (typeof window !== 'undefined') {
        // 获取顶部栏和底部栏的高度
        var headerHeight = document.querySelector('header')?.offsetHeight || 0;
        var footerHeight = document.querySelector('footer')?.offsetHeight || 0;

        // 设置主体内容的上内边距
        var bodyElement = document.querySelector('body');
        if (bodyElement) {
            bodyElement.style.paddingTop = `${headerHeight}px`;
        }
        // 设置主体内容的下内边距
        var bodyElement = document.querySelector('main');
        if (bodyElement) {
            bodyElement.style.paddingBottom = `${footerHeight}px`;
        }
    }
};

export default setResponsivePadding;
