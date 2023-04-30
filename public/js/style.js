// 获取当前页面的url链接，判断是否包含dark。
const url = window.location.href;
if (url.includes("dark")) {
    // 在head插入dark.css
    const head = document.getElementsByTagName("head")[0];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/dark.css";
    link.id = "theme";
    head.appendChild(link);
} else {
    const head = document.getElementsByTagName("head")[0];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/light.css";
    link.id = "theme";
    head.appendChild(link);
}
