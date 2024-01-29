const setResponsivePadding = () => {
    // 直接计算和设置样式
    var headerHeight = document.querySelector('header')?.offsetHeight || 0;
    var footerHeight = document.querySelector('footer')?.offsetHeight || 0;

    var bodyElement = document.querySelector('#body');
    if (bodyElement) {
        bodyElement.style.paddingTop = `${headerHeight}px`;
        bodyElement.style.paddingBottom = `${footerHeight}px`;
    }
};

export default setResponsivePadding;
