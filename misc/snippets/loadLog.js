/*
Paste this whole file in the browser console.
It loads a JSON file and overwrites "milc_survey_log" for scoring tests.

Supported input formats:
1) Direct survey log array (already normalized)
2) Object containing an array in: log | interactions | records | data
3) Firebase analytics export shaped like:
   { events: { "YYYY-MM-DD": { eventId: { scn, node, ans, ts, ... } } } }
*/

(async () => {
	const STORAGE_KEY = "milc_survey_log";
	const BACKUP_KEY = `${STORAGE_KEY}_backup_before_import`;

	const pickJsonFile = () =>
		new Promise((resolve, reject) => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "application/json,.json";
			input.style.display = "none";

			input.addEventListener("change", () => {
				const file = input.files && input.files[0];
				if (!file) {
					reject(new Error("No file selected."));
					return;
				}
				resolve(file);
			});

			document.body.appendChild(input);
			input.click();

			setTimeout(() => {
				if (input.parentNode) {
					input.parentNode.removeChild(input);
				}
			}, 0);
		});

	const asAnswerString = (value) => {
		if (value === true) return "yes";
		if (value === false) return "no";
		if (value === null || value === undefined) return "";
		return String(value);
	};

	const toIsoDate = (value) => {
		if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return value;
		}
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return null;
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	};

	const toSurveyLogRecord = (eventId, event, fallbackDate) => {
		if (!event || typeof event !== "object") return null;

		const scenario = event.scn || event.scenario;
		const nodeId = event.node || event.nodeId;
		if (!scenario || !nodeId) return null;

		const timestamp = Number.isFinite(Number(event.ts)) ? Number(event.ts) : Date.now();
		const date = toIsoDate(event.date) || toIsoDate(fallbackDate) || toIsoDate(timestamp);
		if (!date) return null;

		return {
			id:
				event.id ||
				eventId ||
				(typeof crypto !== "undefined" && crypto.randomUUID
					? crypto.randomUUID()
					: String(Date.now())),
			nodeId,
			scenario,
			answer: asAnswerString(event.ans ?? event.answer),
			date,
			timestamp,
			schemaVersion: 1,
		};
	};

	const extractFirebaseEventsRoot = (payload) => {
		if (!payload || typeof payload !== "object") return null;
		if (payload.events && typeof payload.events === "object") return payload.events;
		if (
			payload.analytics &&
			typeof payload.analytics === "object" &&
			payload.analytics.events &&
			typeof payload.analytics.events === "object"
		) {
			return payload.analytics.events;
		}
		return null;
	};

	const parseLogPayload = (jsonText) => {
		const payload = JSON.parse(jsonText);

		if (Array.isArray(payload)) {
			return { records: payload, normalized: false, skipped: 0 };
		}

		if (payload && typeof payload === "object") {
			const candidates = ["log", "interactions", "records", "data"];
			for (const key of candidates) {
				if (Array.isArray(payload[key])) {
					return { records: payload[key], normalized: false, skipped: 0 };
				}
			}

			const firebaseEvents = extractFirebaseEventsRoot(payload);
			if (firebaseEvents) {
				const records = [];
				let skipped = 0;

				for (const [dateKey, eventsById] of Object.entries(firebaseEvents)) {
					if (!eventsById || typeof eventsById !== "object") continue;
					for (const [eventId, event] of Object.entries(eventsById)) {
						const mapped = toSurveyLogRecord(eventId, event, dateKey);
						if (mapped) {
							records.push(mapped);
						} else {
							skipped += 1;
						}
					}
				}

				records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
				return { records, normalized: true, skipped };
			}
		}

		throw new Error(
			"Invalid JSON format. Provide a survey-log array/object or Firebase events export."
		);
	};

	try {
		const previousValue = localStorage.getItem(STORAGE_KEY);
		if (previousValue !== null) {
			localStorage.setItem(BACKUP_KEY, previousValue);
		}

		const file = await pickJsonFile();
		const text = await file.text();
		const { records, normalized, skipped } = parseLogPayload(text);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

		console.log(`[loadLog] Imported ${records.length} records into "${STORAGE_KEY}".`);
		if (normalized) {
			console.log("[loadLog] Firebase events were converted to survey log format.");
		}
		if (skipped > 0) {
			console.warn(`[loadLog] Skipped ${skipped} invalid events (missing scenario/node/date).`);
		}
		console.log(`[loadLog] Previous value backup key: "${BACKUP_KEY}".`);
		console.log("[loadLog] Reloading page to apply data...");

		location.reload();
	} catch (error) {
		console.error("[loadLog] Import failed:", error);
	}
})();
