import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import membrete from "../assets/membrete.jpg";
import {
    CONTENT_BOTTOM,
    CONTENT_TOP,
    HEADER_HEIGHT,
    KEY_VALUE_VALUE_X,
    PAGE_MARGIN_X,
    SCALE_ICON_GAP,
    SCALE_ICON_SIZE,
} from "../constants";

const loadImageAsDataUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const drawHeader = (doc, headerImageData) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(headerImageData, "JPEG", 0, 0, pageWidth, HEADER_HEIGHT);
};

const addPageWithHeader = (doc, headerImageData) => {
    doc.addPage();
    drawHeader(doc, headerImageData);
    return CONTENT_TOP;
};

const ensureSpace = (doc, y, neededHeight, headerImageData) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + neededHeight <= pageHeight - CONTENT_BOTTOM) return y;
    return addPageWithHeader(doc, headerImageData);
};

const drawKeyValueRow = (doc, y, label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, PAGE_MARGIN_X, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "-", KEY_VALUE_VALUE_X, y);
    return y + 6;
};

// Same colors as the rating circles of the result screen (ResultScales.jsx)
const RATING_CIRCLE_COLORS = {
    4: { fill: "#2e7d32", border: "#2e7d32" },
    3: { fill: "#c62828", border: "#c62828" },
    2: { fill: "stripes", border: "#c62828" },
    1: { fill: "#111111", border: "#111111" },
    0: { fill: null, border: "#9e9e9e" },
};

/**
 * Draws the 4 rating circles of the result screen on a canvas and returns it as a PNG data URL.
 */
const buildRatingCirclesImage = (rating) => {
    const pxPerMm = 12;
    const size = SCALE_ICON_SIZE * pxPerMm;
    const gap = SCALE_ICON_GAP * pxPerMm;
    const lineWidth = size * 0.06;
    const radius = size / 2 - lineWidth;
    const colors = RATING_CIRCLE_COLORS[rating] ?? RATING_CIRCLE_COLORS[0];

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(size * 4 + gap * 3);
    canvas.height = Math.round(size);
    const ctx = canvas.getContext("2d");

    for (let index = 0; index < 4; index += 1) {
        const cx = index * (size + gap) + size / 2;
        const cy = size / 2;
        const isFilled = index < rating && colors.fill;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        if (isFilled === "stripes") {
            ctx.clip();
            const stripe = size * 0.15;
            for (let x = cx - radius, i = 0; x < cx + radius; x += stripe, i += 1) {
                ctx.fillStyle = i % 2 === 0 ? "#c62828" : "#111111";
                ctx.fillRect(x, cy - radius, stripe, radius * 2);
            }
        } else {
            ctx.fillStyle = isFilled ? colors.fill : "#ffffff";
            ctx.fill();
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = colors.border;
        ctx.stroke();
    }

    return canvas.toDataURL("image/png");
};

const drawRatingCircles = (doc, y, rating, scaleLabel) => {
    const labelX = PAGE_MARGIN_X + 2;
    doc.setFont("helvetica", "normal");
    doc.text(`${scaleLabel}:`, labelX, y);

    const labelWidth = doc.getTextWidth(`${scaleLabel}:`);
    const imageX = labelX + labelWidth + 3;
    const imageWidth = SCALE_ICON_SIZE * 4 + SCALE_ICON_GAP * 3;
    doc.addImage(buildRatingCirclesImage(rating), "PNG", imageX, y - SCALE_ICON_SIZE + 0.8, imageWidth, SCALE_ICON_SIZE);
};

const drawChartImage = (doc, y, imageDataUrl, title, headerImageData) => {
    y = ensureSpace(doc, y, 80, headerImageData);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, PAGE_MARGIN_X, y);
    y += 4;

    const pageWidth = doc.internal.pageSize.getWidth();
    const imageWidth = pageWidth - PAGE_MARGIN_X * 2;
    const imageHeight = 68;
    doc.addImage(imageDataUrl, "PNG", PAGE_MARGIN_X, y, imageWidth, imageHeight);
    return y + imageHeight + 6;
};

const buildChartImage = ({ categories, series, yAxisLabel, xAxisLabel }) => {
    const width = 1200;
    const height = 430;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const padding = {
        top: 42,
        right: 30,
        bottom: 74,
        left: 86,
    };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const allValues = series.flatMap((item) => item.data || []).map(Number);
    const maxValue = Math.max(1, ...allValues.filter((value) => Number.isFinite(value)));

    ctx.strokeStyle = "#d8e0e6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    const groupCount = Math.max(categories.length, 1);
    const groupWidth = chartWidth / groupCount;
    const barGroupInnerWidth = groupWidth * 0.72;
    const barWidth = Math.max(10, barGroupInnerWidth / Math.max(series.length, 1));

    categories.forEach((label, index) => {
        const xStart = padding.left + index * groupWidth + (groupWidth - barGroupInnerWidth) / 2;
        series.forEach((entry, seriesIndex) => {
            const value = Number(entry.data?.[index] ?? 0);
            const safeValue = Number.isFinite(value) ? value : 0;
            const ratio = Math.max(0, safeValue / maxValue);
            const barHeight = ratio * chartHeight;
            const x = xStart + seriesIndex * barWidth;
            const y = padding.top + chartHeight - barHeight;

            const gradient = ctx.createLinearGradient(x, y, x, y + Math.max(barHeight, 1));
            const from = entry.color?.from || "#2dc5a2";
            const to = entry.color?.to || from;
            gradient.addColorStop(0, from);
            gradient.addColorStop(1, to);
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, Math.max(barWidth - 2, 2), Math.max(barHeight, 1));
        });

        ctx.fillStyle = "#455a64";
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(String(label), padding.left + index * groupWidth + groupWidth / 2, height - 42);
    });

    ctx.save();
    ctx.fillStyle = "#111827";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(26, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(xAxisLabel, width / 2, height - 14);

    if (series.length > 1) {
        let legendX = padding.left;
        const legendY = 34;

        for (const entry of series) {
            const from = entry.color?.from || "#2dc5a2";
            const to = entry.color?.to || from;
            const gradient = ctx.createLinearGradient(legendX, legendY - 11, legendX, legendY + 5);
            gradient.addColorStop(0, from);
            gradient.addColorStop(1, to);
            ctx.fillStyle = gradient;
            ctx.fillRect(legendX, legendY - 11, 18, 14);

            ctx.fillStyle = "#1f2937";
            ctx.font = "16px Arial";
            ctx.textAlign = "left";
            const label = String(entry.label || "");
            ctx.fillText(label, legendX + 24, legendY);
            legendX += 24 + ctx.measureText(label).width + 20;
        }
    }

    return canvas.toDataURL("image/png");
};

export const downloadReportPdf = async ({
    t,
    fromDate,
    toDate,
    profile,
    setup,
    dairy,
    milk,
    dailyRows,
    safetyAspects,
    fileName,
}) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const headerImageData = await loadImageAsDataUrl(membrete);
    drawHeader(doc, headerImageData);

    let y = CONTENT_TOP;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(t("report.title"), PAGE_MARGIN_X, y);
    y += 8;

    doc.setFontSize(11);
    y = drawKeyValueRow(doc, y, t("report.name"), profile?.name || "-");
    y = drawKeyValueRow(doc, y, t("report.healthCard"), profile?.healthCard || "-");
    y = drawKeyValueRow(doc, y, t("report.queriedPeriod"), `${fromDate || "-"} - ${toDate || "-"}`);
    y = drawKeyValueRow(doc, y, t("report.milkingRoom"), setup.milkingRoom || "-");
    y = drawKeyValueRow(doc, y, t("report.milkingType"), setup.milkingMethod || "-");

    y += 4;
    y = ensureSpace(doc, y, 40, headerImageData);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(t("report.dairyFarm"), PAGE_MARGIN_X, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y = drawKeyValueRow(doc, y, t("report.totalAnimalCount"), String(Number(dairy.averageTotalAnimals ?? 0).toFixed(1)));
    y = drawKeyValueRow(doc, y, t("report.milkingAnimalCount"), String(Number(dairy.averageMilkedAnimals ?? 0).toFixed(1)));
    y = drawKeyValueRow(doc, y, t("report.processedMilkVolume"), String(milk.totalLiters ?? 0));
    y = drawKeyValueRow(doc, y, t("report.milkingDays"), t("report.milkingDaysValue", {
        milked: milk.milkingDays ?? 0,
        total: milk.totalDaysInRange ?? 0,
    }));
    y = drawKeyValueRow(doc, y, t("report.averageLitersPerDay"), String(milk.averageLitersPerDay ?? 0));
    y = drawKeyValueRow(doc, y, t("report.averageLitersPerAnimal"), String(milk.litersPerAnimal ?? 0));

    const dairyChartImage = buildChartImage({
        categories: dairy.categories,
        series: dairy.series,
        yAxisLabel: t("dairyBarChart.count"),
        xAxisLabel: dairy.xAxisLabel,
    });
    y = drawChartImage(doc, y + 2, dairyChartImage, t("report.animalsChartTitle"), headerImageData);

    const milkChartImage = buildChartImage({
        categories: milk.categories,
        series: milk.series,
        yAxisLabel: t("milkBarChart.liters"),
        xAxisLabel: milk.xAxisLabel,
    });
    y = drawChartImage(doc, y, milkChartImage, t("report.processedMilkChartTitle"), headerImageData);

    y = ensureSpace(doc, y + 2, 30, headerImageData);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(t("report.safetyAssessment"), PAGE_MARGIN_X, y);
    y += 6;

    doc.setFontSize(11);
    for (const aspect of safetyAspects) {
        y = ensureSpace(doc, y, 18, headerImageData);

        doc.setFont("helvetica", "bold");
        doc.text(aspect.label, PAGE_MARGIN_X, y);
        y += 5;

        drawRatingCircles(doc, y, aspect.rating, t("report.scale"));
        y += 5;

        const split = doc.splitTextToSize(aspect.detailMessage || t("resultScales.notEvaluated"), 176);
        doc.text(split, PAGE_MARGIN_X + 2, y);
        y += split.length * 4.5 + 3;
    }

    // Daily table goes on its own page at the end of the document.
    y = addPageWithHeader(doc, headerImageData);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(t("report.dailyTableTitle"), PAGE_MARGIN_X, y);
    y += 6;

    autoTable(doc, {
        startY: y,
        margin: { left: PAGE_MARGIN_X, right: PAGE_MARGIN_X, top: CONTENT_TOP },
        head: [[
            t("report.tableDate"),
            t("report.tableAnimalCount"),
            t("report.tableMilkedAnimals"),
            t("report.tableProcessedLiters"),
            t("report.tableMastitisAnimals"),
        ]],
        body: dailyRows.map((row) => [
            row.date,
            String(row.totalAnimals),
            String(row.milkedAnimals),
            String(row.processedLiters),
            String(row.mastitisAnimals),
        ]),
        styles: {
            fontSize: 9,
            cellPadding: 1.6,
        },
        headStyles: {
            fillColor: [26, 128, 144],
        },
        didDrawPage: () => {
            drawHeader(doc, headerImageData);
        },
    });

    doc.save(fileName);
};
