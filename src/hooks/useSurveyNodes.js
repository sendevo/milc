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
 *  1. localStorage cache  — available synchronously from the previous session.
 *  2. Bundled nodes.json  — used only when there is no cache yet (first visit
 *                           or after the cache has been cleared).
 *  3. Firebase /survey    — once the subscription fires, the returned nodes and
 *                           the localStorage cache are both updated.
 *
 * While offline, the hook keeps whatever was last cached; the app stays fully
 * functional without a network connection.
 */
export function useSurveyNodes() {
    const [nodes, setNodes] = useState(() => loadFromCache() ?? fallbackNodes);

    useEffect(() => {
        const surveyRef = ref(db, "survey");
        const unsubscribe = onValue(surveyRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === "object") {
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
