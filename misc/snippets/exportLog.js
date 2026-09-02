/*
Paste this whole file in the browser console.
It exports "milc_survey_log" interactions to a CSV file.
*/

(() => {
	const STORAGE_KEY = "milc_survey_log";

	const csvEscape = (value) => {
		if (value === null || value === undefined) return "";
		const str = String(value);
		if (/[",\n\r]/.test(str)) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const parseStoredLog = () => {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch {
			throw new Error(`Invalid JSON in localStorage key \"${STORAGE_KEY}\".`);
		}

		if (!Array.isArray(parsed)) {
			throw new Error(`Expected \"${STORAGE_KEY}\" to be an array.`);
		}

		return parsed;
	};

	const normalizeRecord = (record, index) => {
		if (!record || typeof record !== "object") return null;

		const id = record.id || `row-${index + 1}`;
		const nodeId = record.nodeId ?? record.node ?? "";
		const scenario = record.scenario ?? record.scn ?? "";
		const answer = record.answer ?? record.ans ?? "";
		const date = record.date ?? "";
		const timestamp = record.timestamp ?? record.ts ?? "";
		const schemaVersion = record.schemaVersion ?? "";

		return {
			id,
			nodeId,
			scenario,
			answer,
			date,
			timestamp,
			schemaVersion,
		};
	};

	const toCsv = (rows) => {
		const headers = ["id", "nodeId", "scenario", "answer", "date", "timestamp", "schemaVersion"];
		const lines = [headers.join(",")];

		for (const row of rows) {
			const values = headers.map((header) => csvEscape(row[header]));
			lines.push(values.join(","));
		}

		return lines.join("\n");
	};

	const downloadCsv = (content, filename) => {
		const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	try {
		const stored = parseStoredLog();
		if (stored.length === 0) {
			console.warn(`[exportLog] No records found in \"${STORAGE_KEY}\".`);
			return;
		}

		const rows = stored
			.map((record, index) => normalizeRecord(record, index))
			.filter(Boolean)
			.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

		const csv = toCsv(rows);
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const dd = String(now.getDate()).padStart(2, "0");
		const hh = String(now.getHours()).padStart(2, "0");
		const mi = String(now.getMinutes()).padStart(2, "0");
		const ss = String(now.getSeconds()).padStart(2, "0");
		const filename = `milc_survey_log_${yyyy}${mm}${dd}_${hh}${mi}${ss}.csv`;

		downloadCsv(csv, filename);
		console.log(`[exportLog] Exported ${rows.length} records to ${filename}.`);
	} catch (error) {
		console.error("[exportLog] Export failed:", error);
	}
})();
