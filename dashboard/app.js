import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
	getAuth,
	signInWithEmailAndPassword,
	signInAnonymously,
	signOut,
	onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const CONFIG_KEY = "milc_dashboard_firebase_config_v1";
const LOGIN_KEY = "milc_dashboard_login_v1";
const DEFAULT_STATUS = "Waiting for Firebase configuration.";
const ENV = import.meta.env || {};

const state = {
	app: null,
	auth: null,
	db: null,
	user: null,
	unsubscribe: null,
	allEvents: [],
	filteredEvents: [],
	charts: {},
};

const els = {
	userPill: document.getElementById("user-pill"),
	connectionPanel: document.getElementById("connection-panel"),
	btnReconfigure: document.getElementById("btn-reconfigure"),
	status: document.getElementById("status"),
	modalFirebase: document.getElementById("modal-firebase"),
	modalLogin: document.getElementById("modal-login"),
	configForm: document.getElementById("firebase-config-form"),
	signInForm: document.getElementById("signin-form"),
	btnOpenFirebaseModal: document.getElementById("btn-open-firebase-modal"),
	btnOpenLoginModal: document.getElementById("btn-open-login-modal"),
	btnFbModalSave: document.getElementById("fb-modal-save"),
	btnFbModalCancel: document.getElementById("fb-modal-cancel"),
	btnFbLoadViteEnv: document.getElementById("fb-load-vite-env"),
	fbModalError: document.getElementById("fb-modal-error"),
	btnFbEnvBrowse: document.getElementById("fb-env-browse"),
	fbEnvFile: document.getElementById("fb-env-file"),
	fbEnvFilename: document.getElementById("fb-env-filename"),
	btnLoginModalSignIn: document.getElementById("login-modal-signin"),
	btnLoginModalCancel: document.getElementById("login-modal-cancel"),
	loginModalError: document.getElementById("login-modal-error"),
	btnLoginEnvBrowse: document.getElementById("login-env-browse"),
	loginEnvFile: document.getElementById("login-env-file"),
	loginEnvFilename: document.getElementById("login-env-filename"),
	btnAnon: document.getElementById("btn-anon"),
	btnSignout: document.getElementById("btn-signout"),
	filterFrom: document.getElementById("filter-from"),
	filterTo: document.getElementById("filter-to"),
	filterCategory: document.getElementById("filter-category"),
	filterPlatform: document.getElementById("filter-platform"),
	quickRange: document.getElementById("quick-range"),
	topNodesBody: document.getElementById("top-nodes-body"),
	heatmap: document.getElementById("activity-heatmap"),
	kpi: {
		totalEvents: document.getElementById("kpi-total-events"),
		activeDays: document.getElementById("kpi-active-days"),
		avgEventsPerDay: document.getElementById("kpi-avg-events-day"),
		correctRate: document.getElementById("kpi-correct-rate"),
		topCategory: document.getElementById("kpi-top-category"),
		topNode: document.getElementById("kpi-top-node"),
	},
	canvases: {
		timeline: document.getElementById("events-timeline"),
		categories: document.getElementById("category-chart"),
		answerTypes: document.getElementById("answer-type-chart"),
		correctness: document.getElementById("correctness-chart"),
		platform: document.getElementById("platform-chart"),
	},
};

const formatNumber = (value) => Intl.NumberFormat("en-US").format(value || 0);

const toIsoDate = (date) => {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

const parseDate = (value) => {
	if (!value) return null;
	const parts = String(value).split("-");
	if (parts.length !== 3) return null;
	const [y, m, d] = parts.map((n) => Number(n));
	if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
	return new Date(y, m - 1, d);
};

const saveConfig = (config) => {
	localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

const saveLogin = (credentials) => {
	localStorage.setItem(LOGIN_KEY, JSON.stringify(credentials));
};

const loadConfig = () => {
	try {
		const raw = localStorage.getItem(CONFIG_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const loadLogin = () => {
	try {
		const raw = localStorage.getItem(LOGIN_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const loadConfigFromEnv = () => ({
	apiKey: ENV.VITE_FIREBASE_API_KEY || "",
	authDomain: ENV.VITE_FIREBASE_AUTH_DOMAIN || "",
	projectId: ENV.VITE_FIREBASE_PROJECT_ID || "",
	databaseURL: ENV.VITE_FIREBASE_DATABASE_URL || "",
	appId: ENV.VITE_FIREBASE_APP_ID || "",
	storageBucket: ENV.VITE_FIREBASE_STORAGE_BUCKET || "",
	messagingSenderId: ENV.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
});

const loadLoginFromEnv = () => ({
	email:
		ENV.VITE_FIREBASE_EMAIL ||
		ENV.VITE_DASHBOARD_EMAIL ||
		"",
	password:
		ENV.VITE_FIREBASE_PASSWORD ||
		ENV.VITE_DASHBOARD_PASSWORD ||
		"",
});

const parseEnvText = (envText) => {
	const vars = {};
	String(envText || "")
		.split(/\r?\n/)
		.forEach((line) => {
			const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
			if (!match) return;
			vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
		});
	return vars;
};

const readFileText = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => resolve(String(event?.target?.result || ""));
		reader.onerror = () => reject(new Error("Unable to read file."));
		reader.readAsText(file);
	});

const mapFirebaseConfigFromEnvVars = (vars) => ({
	apiKey: vars.VITE_FIREBASE_API_KEY || "",
	authDomain: vars.VITE_FIREBASE_AUTH_DOMAIN || "",
	projectId: vars.VITE_FIREBASE_PROJECT_ID || "",
	databaseURL: vars.VITE_FIREBASE_DATABASE_URL || "",
	appId: vars.VITE_FIREBASE_APP_ID || "",
	storageBucket: vars.VITE_FIREBASE_STORAGE_BUCKET || "",
	messagingSenderId: vars.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
});

const mapLoginFromEnvVars = (vars) => ({
	email: vars.VITE_FIREBASE_EMAIL || vars.VITE_DASHBOARD_EMAIL || vars.FIREBASE_EMAIL || vars.EMAIL || "",
	password: vars.VITE_FIREBASE_PASSWORD || vars.VITE_DASHBOARD_PASSWORD || vars.FIREBASE_PASSWORD || vars.PASSWORD || "",
});

const setStatus = (message, type = "info") => {
	els.status.textContent = message;
	els.status.className = `status ${type}`;
};

const updateConnectionVisibility = () => {
	const connected = Boolean(state.app);
	if (els.connectionPanel) {
		els.connectionPanel.style.display = connected ? "none" : "block";
	}
	if (els.btnReconfigure) {
		els.btnReconfigure.style.display = connected ? "inline-flex" : "none";
	}
};

const setSignedInUI = (user) => {
	if (!user) {
		els.userPill.textContent = "Not signed in";
		els.btnSignout.disabled = true;
		return;
	}

	els.userPill.textContent = user.isAnonymous
		? `Anonymous user ${user.uid.slice(0, 8)}...`
		: user.email || user.uid;
	els.btnSignout.disabled = false;
};

const getFormConfig = () => {
	const formData = new FormData(els.configForm);
	return {
		apiKey: String(formData.get("apiKey") || "").trim(),
		authDomain: String(formData.get("authDomain") || "").trim(),
		projectId: String(formData.get("projectId") || "").trim(),
		databaseURL: String(formData.get("databaseURL") || "").trim(),
		appId: String(formData.get("appId") || "").trim(),
		storageBucket: String(formData.get("storageBucket") || "").trim(),
		messagingSenderId: String(formData.get("messagingSenderId") || "").trim(),
	};
};

const fillConfigForm = (config) => {
	if (!config) return;
	Object.entries(config).forEach(([k, v]) => {
		const input = els.configForm.elements[k];
		if (input) input.value = v || "";
	});
};

const fillLoginForm = (credentials) => {
	if (!credentials) return;
	const emailInput = els.signInForm?.elements?.email;
	const passwordInput = els.signInForm?.elements?.password;
	if (emailInput) emailInput.value = credentials.email || "";
	if (passwordInput) passwordInput.value = credentials.password || "";
};

const setModalError = (type, message = "") => {
	const el = type === "firebase" ? els.fbModalError : els.loginModalError;
	if (!el) return;
	if (!message) {
		el.style.display = "none";
		el.textContent = "";
		return;
	}
	el.textContent = message;
	el.style.display = "block";
};

const openModal = (modal) => {
	if (!modal) return;
	modal.style.display = "flex";
};

const closeModal = (modal) => {
	if (!modal) return;
	modal.style.display = "none";
};

const openFirebaseModal = () => {
	fillConfigForm(loadConfig() || loadConfigFromEnv());
	if (els.fbEnvFilename) els.fbEnvFilename.textContent = "No file selected";
	setModalError("firebase", "");
	openModal(els.modalFirebase);
};

const openLoginModal = () => {
	fillLoginForm(loadLogin() || loadLoginFromEnv());
	if (els.loginEnvFilename) els.loginEnvFilename.textContent = "No file selected";
	setModalError("login", "");
	openModal(els.modalLogin);
};

const initFirebase = (config) => {
	if (state.app) {
		updateConnectionVisibility();
		return;
	}

	if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.databaseURL || !config?.appId) {
		throw new Error("Firebase config is incomplete.");
	}

	const app = getApps()[0] || initializeApp(config);
	state.app = app;
	state.auth = getAuth(app);
	state.db = getDatabase(app);
	updateConnectionVisibility();

	onAuthStateChanged(state.auth, (user) => {
		state.user = user || null;
		setSignedInUI(state.user);

		if (state.unsubscribe) {
			state.unsubscribe();
			state.unsubscribe = null;
		}

		if (!user) {
			state.allEvents = [];
			renderAll();
			setStatus("Signed out. Sign in to load telemetry.", "info");
			return;
		}

		subscribeToUserEvents(user.uid);
	});
};

const subscribeToUserEvents = (uid) => {
	if (!state.db) return;

	const eventsRef = ref(state.db, `users/${uid}/analytics/events`);
	const unsubscribe = onValue(
		eventsRef,
		(snapshot) => {
			const raw = snapshot.val() || {};
			state.allEvents = flattenEvents(raw);
			populateFilterOptions(state.allEvents);
			applyFiltersAndRender();
			setStatus(`Loaded ${formatNumber(state.allEvents.length)} events for user ${uid}.`, "success");
		},
		(error) => {
			setStatus(`Failed to read analytics: ${error.message}`, "error");
		}
	);

	state.unsubscribe = () => {
		unsubscribe();
	};
};

const normalizeEvent = (dayKey, eventId, rawEvent) => {
	const ts = Number(rawEvent?.ts);
	const dateFromTs = Number.isFinite(ts) ? new Date(ts) : null;
	const isoFromTs = dateFromTs ? toIsoDate(dateFromTs) : "";
	const day = /^\d{4}-\d{2}-\d{2}$/.test(dayKey) ? dayKey : isoFromTs;
	const date = parseDate(day) || dateFromTs || null;

	let hour = null;
	let weekDay = null;
	if (dateFromTs && !Number.isNaN(dateFromTs.getTime())) {
		hour = dateFromTs.getHours();
		const jsDay = dateFromTs.getDay();
		weekDay = jsDay === 0 ? 6 : jsDay - 1;
	}

	return {
		id: eventId,
		day,
		date,
		ts: Number.isFinite(ts) ? ts : null,
		node: rawEvent?.node || "unknown",
		scenario: rawEvent?.scn || "-",
		category: rawEvent?.cat || "uncategorized",
		answerType: rawEvent?.ans_t || "enum",
		answer: rawEvent?.ans,
		ok: rawEvent?.ok === true ? true : rawEvent?.ok === false ? false : null,
		severity: rawEvent?.sev ?? null,
		periodicity: rawEvent?.per ?? null,
		appVersion: rawEvent?.app_v || "unknown",
		platform: rawEvent?.platform || "unknown",
		language: rawEvent?.lang || "unknown",
		hour,
		weekDay,
	};
};

const flattenEvents = (eventsByDay) => {
	const rows = [];
	for (const [dayKey, entries] of Object.entries(eventsByDay || {})) {
		if (!entries || typeof entries !== "object") continue;
		for (const [eventId, rawEvent] of Object.entries(entries)) {
			rows.push(normalizeEvent(dayKey, eventId, rawEvent));
		}
	}

	rows.sort((a, b) => (a.ts || 0) - (b.ts || 0));
	return rows;
};

const increment = (map, key, amount = 1) => {
	map.set(key, (map.get(key) || 0) + amount);
};

const mapToSortedPairs = (map) => {
	return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

const getDateBounds = (events) => {
	if (!events.length) return { min: "", max: "" };
	const days = events.map((e) => e.day).filter(Boolean).sort();
	return {
		min: days[0] || "",
		max: days[days.length - 1] || "",
	};
};

const populateFilterOptions = (events) => {
	const categories = new Set();
	const platforms = new Set();

	events.forEach((e) => {
		categories.add(e.category || "uncategorized");
		platforms.add(e.platform || "unknown");
	});

	const currentCategory = els.filterCategory.value || "all";
	const currentPlatform = els.filterPlatform.value || "all";

	els.filterCategory.innerHTML = '<option value="all">All categories</option>';
	[...categories].sort().forEach((cat) => {
		const option = document.createElement("option");
		option.value = cat;
		option.textContent = cat;
		els.filterCategory.appendChild(option);
	});

	els.filterPlatform.innerHTML = '<option value="all">All platforms</option>';
	[...platforms].sort().forEach((platform) => {
		const option = document.createElement("option");
		option.value = platform;
		option.textContent = platform;
		els.filterPlatform.appendChild(option);
	});

	els.filterCategory.value = categories.has(currentCategory) ? currentCategory : "all";
	els.filterPlatform.value = platforms.has(currentPlatform) ? currentPlatform : "all";

	const bounds = getDateBounds(events);
	if (!els.filterFrom.value) els.filterFrom.value = bounds.min;
	if (!els.filterTo.value) els.filterTo.value = bounds.max;
};

const applyFilters = (events) => {
	const from = parseDate(els.filterFrom.value);
	const to = parseDate(els.filterTo.value);
	if (to) to.setHours(23, 59, 59, 999);

	const category = els.filterCategory.value;
	const platform = els.filterPlatform.value;

	return events.filter((e) => {
		if (from && e.date && e.date < from) return false;
		if (to && e.date && e.date > to) return false;
		if (category !== "all" && e.category !== category) return false;
		if (platform !== "all" && e.platform !== platform) return false;
		return true;
	});
};

const computeMetrics = (events) => {
	const totalEvents = events.length;
	const daysMap = new Map();
	const byCategory = new Map();
	const byNode = new Map();

	let correctTotal = 0;
	let correctKnown = 0;

	events.forEach((event) => {
		if (event.day) increment(daysMap, event.day);
		increment(byCategory, event.category || "uncategorized");
		increment(byNode, event.node || "unknown");

		if (event.ok === true || event.ok === false) {
			correctKnown += 1;
			if (event.ok === true) correctTotal += 1;
		}
	});

	const activeDays = daysMap.size;
	const avgEventsPerDay = activeDays ? totalEvents / activeDays : 0;
	const correctRate = correctKnown ? (correctTotal / correctKnown) * 100 : 0;

	const topCategory = mapToSortedPairs(byCategory)[0]?.[0] || "-";
	const topNode = mapToSortedPairs(byNode)[0]?.[0] || "-";

	return {
		totalEvents,
		activeDays,
		avgEventsPerDay,
		correctRate,
		topCategory,
		topNode,
	};
};

const updateKpis = (events) => {
	const metrics = computeMetrics(events);
	els.kpi.totalEvents.textContent = formatNumber(metrics.totalEvents);
	els.kpi.activeDays.textContent = formatNumber(metrics.activeDays);
	els.kpi.avgEventsPerDay.textContent = metrics.avgEventsPerDay.toFixed(2);
	els.kpi.correctRate.textContent = `${metrics.correctRate.toFixed(1)}%`;
	els.kpi.topCategory.textContent = metrics.topCategory;
	els.kpi.topNode.textContent = metrics.topNode;
};

const createOrReplaceChart = (key, canvas, config) => {
	if (!canvas || typeof Chart === "undefined") return;
	if (state.charts[key]) {
		state.charts[key].destroy();
	}
	state.charts[key] = new Chart(canvas.getContext("2d"), config);
};

const renderTimelineChart = (events) => {
	const counts = new Map();
	events.forEach((event) => increment(counts, event.day || "unknown"));
	const labels = [...counts.keys()].sort();
	const values = labels.map((label) => counts.get(label));

	createOrReplaceChart("timeline", els.canvases.timeline, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					label: "Events",
					data: values,
					borderColor: "#00c2a8",
					backgroundColor: "rgba(0,194,168,0.22)",
					fill: true,
					tension: 0.3,
					pointRadius: 2,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
			},
			scales: {
				x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
				y: { beginAtZero: true },
			},
		},
	});
};

const renderPieChart = (key, canvas, title, map, colors) => {
	const pairs = mapToSortedPairs(map);
	const labels = pairs.map(([name]) => name);
	const values = pairs.map(([, value]) => value);

	createOrReplaceChart(key, canvas, {
		type: "doughnut",
		data: {
			labels,
			datasets: [
				{
					label: title,
					data: values,
					backgroundColor: colors,
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: "bottom" },
			},
		},
	});
};

const renderPlatformChart = (events) => {
	const map = new Map();
	events.forEach((e) => increment(map, e.platform || "unknown"));
	const pairs = mapToSortedPairs(map);

	createOrReplaceChart("platform", els.canvases.platform, {
		type: "bar",
		data: {
			labels: pairs.map(([label]) => label),
			datasets: [
				{
					label: "Events",
					data: pairs.map(([, count]) => count),
					backgroundColor: "#ff8b3d",
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false } },
			scales: { y: { beginAtZero: true } },
		},
	});
};

const renderCharts = (events) => {
	const byCategory = new Map();
	const byAnswerType = new Map();
	const byCorrectness = new Map([
		["correct", 0],
		["incorrect", 0],
		["unknown", 0],
	]);

	events.forEach((event) => {
		increment(byCategory, event.category || "uncategorized");
		increment(byAnswerType, event.answerType || "enum");

		if (event.ok === true) increment(byCorrectness, "correct");
		else if (event.ok === false) increment(byCorrectness, "incorrect");
		else increment(byCorrectness, "unknown");
	});

	renderTimelineChart(events);

	renderPieChart(
		"categories",
		els.canvases.categories,
		"Categories",
		byCategory,
		["#00c2a8", "#ff8b3d", "#1d7afc", "#f05454", "#4bc0c0", "#ffce56", "#8bc34a", "#607d8b"]
	);

	renderPieChart(
		"answerTypes",
		els.canvases.answerTypes,
		"Answer types",
		byAnswerType,
		["#1d7afc", "#00c2a8", "#ff8b3d", "#f05454"]
	);

	renderPieChart(
		"correctness",
		els.canvases.correctness,
		"Correctness",
		byCorrectness,
		["#00c853", "#ff5252", "#90a4ae"]
	);

	renderPlatformChart(events);
};

const renderTopNodesTable = (events) => {
	const nodeMap = new Map();

	events.forEach((event) => {
		if (!nodeMap.has(event.node)) {
			nodeMap.set(event.node, {
				node: event.node,
				scenario: event.scenario,
				category: event.category,
				count: 0,
				okKnown: 0,
				okCount: 0,
			});
		}

		const row = nodeMap.get(event.node);
		row.count += 1;
		if (event.ok === true || event.ok === false) {
			row.okKnown += 1;
			if (event.ok === true) row.okCount += 1;
		}
	});

	const rows = [...nodeMap.values()]
		.sort((a, b) => b.count - a.count)
		.slice(0, 12);

	if (!rows.length) {
		els.topNodesBody.innerHTML = '<tr><td colspan="5" class="muted">No data yet.</td></tr>';
		return;
	}

	els.topNodesBody.innerHTML = rows
		.map((row) => {
			const pct = row.okKnown ? ((row.okCount / row.okKnown) * 100).toFixed(1) : "-";
			return `
				<tr>
					<td>${row.node}</td>
					<td>${row.scenario || "-"}</td>
					<td>${row.category || "uncategorized"}</td>
					<td>${formatNumber(row.count)}</td>
					<td>${pct === "-" ? "-" : `${pct}%`}</td>
				</tr>
			`;
		})
		.join("");
};

const renderHeatmap = (events) => {
	const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
	let max = 0;

	events.forEach((event) => {
		if (!Number.isInteger(event.weekDay) || !Number.isInteger(event.hour)) return;
		matrix[event.weekDay][event.hour] += 1;
		if (matrix[event.weekDay][event.hour] > max) {
			max = matrix[event.weekDay][event.hour];
		}
	});

	const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const frag = document.createDocumentFragment();
	els.heatmap.innerHTML = "";

	const headerSpacer = document.createElement("div");
	headerSpacer.className = "heatmap-label";
	headerSpacer.textContent = "";
	frag.appendChild(headerSpacer);

	for (let hour = 0; hour < 24; hour += 1) {
		const h = document.createElement("div");
		h.className = "heatmap-label hour";
		h.textContent = String(hour).padStart(2, "0");
		frag.appendChild(h);
	}

	for (let day = 0; day < 7; day += 1) {
		const dayLabel = document.createElement("div");
		dayLabel.className = "heatmap-label day";
		dayLabel.textContent = dayNames[day];
		frag.appendChild(dayLabel);

		for (let hour = 0; hour < 24; hour += 1) {
			const value = matrix[day][hour];
			const strength = max > 0 ? value / max : 0;
			const cell = document.createElement("div");
			cell.className = "heatmap-cell";
			cell.style.setProperty("--strength", strength.toFixed(3));
			cell.title = `${dayNames[day]} ${String(hour).padStart(2, "0")}:00 -> ${value} events`;
			cell.textContent = value > 0 ? String(value) : "";
			frag.appendChild(cell);
		}
	}

	els.heatmap.appendChild(frag);
};

const renderEmptyState = () => {
	updateKpis([]);
	renderTopNodesTable([]);
	renderHeatmap([]);

	Object.values(state.charts).forEach((chart) => chart.destroy());
	state.charts = {};
};

const renderAll = () => {
	const events = state.filteredEvents;
	if (!events.length) {
		renderEmptyState();
		return;
	}

	updateKpis(events);
	renderCharts(events);
	renderTopNodesTable(events);
	renderHeatmap(events);
};

const applyFiltersAndRender = () => {
	state.filteredEvents = applyFilters(state.allEvents);
	renderAll();
};

const setQuickRange = (rangeValue) => {
	const buttons = els.quickRange.querySelectorAll(".chip");
	buttons.forEach((btn) => {
		btn.classList.toggle("active", btn.dataset.range === rangeValue);
	});

	const bounds = getDateBounds(state.allEvents);
	if (!bounds.max) {
		els.filterFrom.value = "";
		els.filterTo.value = "";
		applyFiltersAndRender();
		return;
	}

	if (rangeValue === "all") {
		els.filterFrom.value = bounds.min;
		els.filterTo.value = bounds.max;
		applyFiltersAndRender();
		return;
	}

	const days = Number(rangeValue);
	if (!Number.isFinite(days) || days <= 0) return;

	const endDate = parseDate(bounds.max);
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - (days - 1));

	const minDate = parseDate(bounds.min);
	const adjustedStart = minDate && startDate < minDate ? minDate : startDate;

	els.filterFrom.value = toIsoDate(adjustedStart);
	els.filterTo.value = toIsoDate(endDate);
	applyFiltersAndRender();
};

const bindEvents = () => {
	els.btnReconfigure.addEventListener("click", openFirebaseModal);

	els.btnOpenFirebaseModal.addEventListener("click", openFirebaseModal);
	els.btnOpenLoginModal.addEventListener("click", openLoginModal);

	els.btnFbModalSave.addEventListener("click", () => {
		const alreadyConnected = Boolean(state.app);
		const config = getFormConfig();
		saveConfig(config);

		try {
			initFirebase(config);
			setStatus(
				alreadyConnected
					? "Firebase config saved. Reload page to apply changes."
					: "Firebase initialized. Sign in to load data.",
				"success"
			);
			closeModal(els.modalFirebase);
		} catch (error) {
			setModalError("firebase", error.message || "Failed to initialize Firebase.");
		}
	});

	els.btnFbLoadViteEnv.addEventListener("click", () => {
		const config = loadConfigFromEnv();
		fillConfigForm(config);
		setModalError("firebase", "");
	});

	els.btnFbModalCancel.addEventListener("click", () => closeModal(els.modalFirebase));

	els.btnFbEnvBrowse.addEventListener("click", () => {
		els.fbEnvFile.click();
	});

	els.fbEnvFile.addEventListener("change", async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (els.fbEnvFilename) els.fbEnvFilename.textContent = file.name;

		try {
			const text = await readFileText(file);
			const vars = parseEnvText(text);
			fillConfigForm(mapFirebaseConfigFromEnvVars(vars));
			setModalError("firebase", "");
		} catch (error) {
			setModalError("firebase", error.message || "Could not parse .env file.");
		}

		event.target.value = "";
	});

	const signInWithCurrentFormValues = async () => {
		setModalError("login", "");

		if (!state.auth) {
			setModalError("login", "Initialize Firebase first.");
			return;
		}

		const formData = new FormData(els.signInForm);
		const email = String(formData.get("email") || "").trim();
		const password = String(formData.get("password") || "");

		if (!email || !password) {
			setModalError("login", "Email and password are required.");
			return;
		}

		saveLogin({ email, password });

		try {
			await signInWithEmailAndPassword(state.auth, email, password);
			setStatus("Signed in successfully.", "success");
			closeModal(els.modalLogin);
		} catch (error) {
			setModalError("login", `Sign-in failed: ${error.message}`);
		}
	};

	els.btnLoginModalSignIn.addEventListener("click", signInWithCurrentFormValues);

	els.signInForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		await signInWithCurrentFormValues();
	});

	els.btnLoginModalCancel.addEventListener("click", () => closeModal(els.modalLogin));

	els.btnLoginEnvBrowse.addEventListener("click", () => {
		els.loginEnvFile.click();
	});

	els.loginEnvFile.addEventListener("change", async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (els.loginEnvFilename) els.loginEnvFilename.textContent = file.name;

		try {
			const text = await readFileText(file);
			const vars = parseEnvText(text);
			fillLoginForm(mapLoginFromEnvVars(vars));
			setModalError("login", "");
		} catch (error) {
			setModalError("login", error.message || "Could not parse .env file.");
		}

		event.target.value = "";
	});

	els.btnAnon.addEventListener("click", async () => {
		if (!state.auth) {
			setStatus("Initialize Firebase first.", "error");
			return;
		}

		try {
			await signInAnonymously(state.auth);
			setStatus("Signed in anonymously.", "success");
		} catch (error) {
			setStatus(`Anonymous sign-in failed: ${error.message}`, "error");
		}
	});

	els.btnSignout.addEventListener("click", async () => {
		if (!state.auth) return;
		await signOut(state.auth);
	});

	[els.filterFrom, els.filterTo, els.filterCategory, els.filterPlatform].forEach((control) => {
		control.addEventListener("change", () => {
			const active = els.quickRange.querySelector(".chip.active");
			if (active) active.classList.remove("active");
			applyFiltersAndRender();
		});
	});

	els.quickRange.addEventListener("click", (event) => {
		const btn = event.target.closest("button[data-range]");
		if (!btn) return;
		setQuickRange(btn.dataset.range);
	});

	[els.modalFirebase, els.modalLogin].forEach((modal) => {
		modal.addEventListener("click", (event) => {
			if (event.target === modal) closeModal(modal);
		});
	});
};

const bootstrap = () => {
	bindEvents();
	updateConnectionVisibility();
	setStatus(DEFAULT_STATUS, "info");

	const saved = loadConfig();
	if (saved) {
		fillConfigForm(saved);
		try {
			initFirebase(saved);
			setStatus("Firebase initialized from saved config.", "success");
			updateConnectionVisibility();
		} catch (error) {
			setStatus(`Saved config invalid: ${error.message}`, "error");
			updateConnectionVisibility();
		}
		return;
	}

	const envConfig = loadConfigFromEnv();
	if (envConfig.apiKey) {
		fillConfigForm(envConfig);
	}

	fillLoginForm(loadLogin() || loadLoginFromEnv());
	updateConnectionVisibility();
};

bootstrap();
