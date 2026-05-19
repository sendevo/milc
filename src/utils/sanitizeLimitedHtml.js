export const sanitizeLimitedHtml = (value) => {
    if (typeof value !== "string") return "";

    const escaped = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    return escaped
        .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
        .replace(/&lt;b&gt;/gi, "<b>")
        .replace(/&lt;\/b&gt;/gi, "</b>")
        .replace(/&lt;i&gt;/gi, "<i>")
        .replace(/&lt;\/i&gt;/gi, "</i>");
};