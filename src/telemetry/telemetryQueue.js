import { Capacitor } from "@capacitor/core";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { getJSONItem, setJSONItem } from "../utils/persistentStorage";

const TELEMETRY_QUEUE_KEY = "milc_telemetry_queue_v1";
const TELEMETRY_SENT_IDS_KEY = "milc_telemetry_sent_ids_v1";
const TELEMETRY_SCHEMA_VERSION = 1;
const FLUSH_BATCH_SIZE = 20;
const MAX_SENT_IDS = 2000;
const MAX_QUEUED_EVENTS = 1000;
const FLUSH_AGE_MS = 3 * 60 * 1000;

const now = () => Date.now();

const makeEventId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${now()}-${Math.random().toString(16).slice(2)}`;

const localDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const normalizeAnswer = (answer) => {
    if (typeof answer !== "string") return answer;
    return answer.trim().toLowerCase();
};

const detectAnswerType = (answer) => {
    if (Array.isArray(answer)) return "list";
    if (typeof answer === "number") return "number";
    if (typeof answer === "string") {
        const normalized = normalizeAnswer(answer);
        if (normalized === "yes" || normalized === "no") {
            return "bool";
        }
    }
    return "enum";
};

const currentPlatform = () => {
    const platform = Capacitor.getPlatform();
    if (platform === "android" || platform === "ios" || platform === "web") {
        return platform;
    }
    return "web";
};

const readQueue = async () => {
    const data = await getJSONItem(TELEMETRY_QUEUE_KEY, []);
    return Array.isArray(data) ? data : [];
};

const writeQueue = async (events) => {
    await setJSONItem(TELEMETRY_QUEUE_KEY, events.slice(-MAX_QUEUED_EVENTS));
};

const readSentIds = async () => {
    const data = await getJSONItem(TELEMETRY_SENT_IDS_KEY, []);
    return Array.isArray(data) ? data : [];
};

const writeSentIds = async (ids) => {
    await setJSONItem(TELEMETRY_SENT_IDS_KEY, ids.slice(-MAX_SENT_IDS));
};

export const buildTelemetryEvent = ({
    uid,
    nodeId,
    scenario,
    category,
    answer,
    isCorrect,
    severity,
    periodicity,
    language,
    appVersion,
}) => {
    return {
        eid: makeEventId(),
        uid: uid || null,
        day: localDateString(),
        ts: now(),
        node: nodeId,
        scn: scenario || null,
        cat: category || "uncategorized",
        ans: answer,
        ans_t: detectAnswerType(answer),
        ok: isCorrect ?? null,
        sev: Number.isFinite(Number(severity)) && Number(severity) > 0 ? Number(severity) : null,
        per: periodicity || null,
        app_v: appVersion || "unknown",
        platform: currentPlatform(),
        lang: language?.slice?.(0, 2) || "es",
        sync_v: TELEMETRY_SCHEMA_VERSION,
    };
};

export const enqueueTelemetryEvent = async (event) => {
    const queue = await readQueue();
    queue.push(event);
    await writeQueue(queue);
};

const shouldFlush = (queue, force) => {
    if (force) return true;
    if (queue.length >= FLUSH_BATCH_SIZE) return true;

    const oldestTs = queue[0]?.ts;
    if (!oldestTs) return false;
    return now() - oldestTs >= FLUSH_AGE_MS;
};

const writeBatchToRealtimeDatabase = async (batch) => {
    const updates = {};

    for (const event of batch) {
        if (!event?.uid || !event?.day || !event?.eid) {
            continue;
        }

        // Compact payload: uid/day are represented in the path.
        updates[`users/${event.uid}/analytics/events/${event.day}/${event.eid}`] = {
            ts: event.ts,
            node: event.node,
            scn: event.scn,
            cat: event.cat,
            ans: event.ans,
            ans_t: event.ans_t,
            ok: event.ok,
            sev: event.sev,
            per: event.per,
            app_v: event.app_v,
            platform: event.platform,
            lang: event.lang,
            sync_v: event.sync_v,
        };
    }

    if (!Object.keys(updates).length) {
        return false;
    }

    await update(ref(db), updates);
    return true;
};

export const flushTelemetryQueue = async ({ force = false } = {}) => {
    const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;

    const queue = await readQueue();
    if (!queue.length || !shouldFlush(queue, force)) {
        return { sent: 0, remaining: queue.length, skipped: false };
    }

    const sentIds = new Set(await readSentIds());
    const unsent = queue.filter((event) => !sentIds.has(event.eid));
    const batch = unsent.slice(0, FLUSH_BATCH_SIZE);

    if (!batch.length) {
        return { sent: 0, remaining: queue.length, skipped: false };
    }

    let sent = false;

    try {
        if (endpoint) {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ events: batch }),
            });
            sent = response.ok;
        } else {
            sent = await writeBatchToRealtimeDatabase(batch);
        }
    } catch {
        return { sent: 0, remaining: queue.length, skipped: false };
    }

    if (!sent) {
        return { sent: 0, remaining: queue.length, skipped: false };
    }

    const batchIds = new Set(batch.map((event) => event.eid));
    const remaining = queue.filter((event) => !batchIds.has(event.eid));
    await writeQueue(remaining);
    await writeSentIds([...sentIds, ...batchIds]);

    return { sent: batch.length, remaining: remaining.length, skipped: false };
};
