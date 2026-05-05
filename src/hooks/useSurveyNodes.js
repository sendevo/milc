import { useEffect, useState } from "react";
import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase";
import fallbackNodes from "../survey/nodes.json";

const CACHE_KEY = "milc_survey_nodes";

function loadFromCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        console.log("Loaded survey nodes from cache:", raw ? "found" : "not found");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
        // storage quota exceeded or private browsing — silently skip
    }
}

/**
 * Returns the survey node map, kept in sync with Firebase Realtime Database
 * at the `/survey` path.
 *
 * Loading order:
 *  1. localStorage cache  — if its timestamp >= bundled nodes.json timestamp.
 *  2. Bundled nodes.json  — when there is no cache, or the cache is older than
 *                           the bundled version (e.g. after an app update).
 *  3. Firebase /survey    — once the subscription fires, the returned nodes and
 *                           the localStorage cache are both updated.
 *
 * While offline, the hook keeps whatever was last cached; the app stays fully
 * functional without a network connection.
 */
export function useSurveyNodes() {
    const [nodes, setNodes] = useState(() => {
        const cached = loadFromCache();
        const cachedTs = cached?.timestamp ?? 0;
        const bundledTs = fallbackNodes.timestamp ?? 0;
        if (cached && cachedTs >= bundledTs) return cached;
        // Bundled nodes are newer — replace stale cache immediately.
        saveToCache(fallbackNodes);
        return fallbackNodes;
    });

    useEffect(() => {
        const surveyRef = ref(db, "survey");
        const unsubscribe = onValue(surveyRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === "object") {
                const remoteTs = data.timestamp ?? 0;
                const bundledTs = fallbackNodes.timestamp ?? 0;
                if (remoteTs < bundledTs) {
                    // Remote data is older than the bundled version — ignore it
                    // so that bug-fixes shipped in the bundle take precedence.
                    return;
                }
                saveToCache(data);
                setNodes(data);
            }
        });
        return unsubscribe;
    }, []);

    return nodes;
}

/**
 * Clears the localStorage survey-nodes cache and fetches a fresh copy from
 * Firebase Realtime Database. Any active `useSurveyNodes` subscription will
 * receive the update automatically via its `onValue` listener.
 */
export async function refreshSurveyNodes() {
    localStorage.removeItem(CACHE_KEY);
    const surveyRef = ref(db, "survey");
    const snapshot = await get(surveyRef);
    const data = snapshot.val();
    if (data && typeof data === "object") {
        saveToCache(data);
    }
}
