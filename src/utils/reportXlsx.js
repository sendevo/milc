import * as XLSX from "xlsx";

export const downloadDailyRowsXlsx = ({
    t,
    dailyRows,
    fromDate,
    toDate,
    fileName,
}) => {
    const headers = [
        t("report.tableDate"),
        t("report.tableAnimalCount"),
        t("report.tableMilkedAnimals"),
        t("report.tableProcessedLiters"),
        t("report.tableMastitisAnimals"),
    ];

    const body = (dailyRows || []).map((row) => [
        row.date,
        Number(row.totalAnimals ?? 0),
        Number(row.milkedAnimals ?? 0),
        Number(row.processedLiters ?? 0),
        Number(row.mastitisAnimals ?? 0),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
    worksheet["!cols"] = [
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 24 },
        { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    const sheetName = String(t("report.dailyTableSheetName") || "Daily Data").slice(0, 31);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    workbook.Props = {
        Title: t("report.title"),
        Subject: `${fromDate || "-"} - ${toDate || "-"}`,
        Author: "MILC",
    };

    XLSX.writeFile(workbook, fileName, { compression: true });
};
