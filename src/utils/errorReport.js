import html2canvas from "html2canvas";

export const generateErrorReportImage = async (element) => {
    if (!element) {
        throw new Error("Error report element not found");
    }

    const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        logging: false,
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not generate error report image"));
                return;
            }

            resolve(
                new File(
                    [blob],
                    `error-report-${Date.now()}.png`,
                    {
                        type: "image/png",
                    }
                )
            );
        }, "image/png");
    });
};