/**
 * Model utilities and helpers.
 *
 * This module contains functions that are used across the app to handle
 * common tasks related to the survey model, such as resolving labels and
 * determining the next node in the survey flow.
 *
 * The `t` function is a simple localization helper that resolves a bilingual
 * text object `{ en, es }` to the string for the active language, falling back
 * to English if the current language is unavailable.
 *
 * The `resolveTarget` function takes a survey node and the current answers,
 * and determines the target node ID by searching field options for a matching
 * answer value and extracting its `target` attribute.
 *
 * Returns the target node ID string, or null if no target found or branch ended.
 */

import i18n from "../i18n";
export { runAction, ACTION_IDS } from "./actions";

export const t = (text) => {
    const lang = i18n.language?.slice(0, 2) ?? "es";
    if (text && typeof text === "object") {
        return text[lang] ?? text.en ?? "";
    }
    return text ?? "";
};

/**
 * Resolve the target node ID using either:
 * 1. New target-based system: finds target in field options or field-level target attribute
 * 2. Legacy next-based system: uses node's next field (for backward compatibility with tests)
 * 
 * @param {object} node - The current survey node
 * @param {object} answers - Map of fieldId → answer value
 * @returns {string|null} Target node ID or null
 */
export const resolveTarget = (node, answers) => {
    if (!node || typeof node !== "object") {
        return null;
    }

    // First, try the legacy "next" attribute system (for backward compatibility)
    if (Object.prototype.hasOwnProperty.call(node, 'next')) {
        const { next } = node;
        if (next === null) return null;
        if (typeof next === "string") {
            return next;
        }
        // next is an object with field and map
        if (next && typeof next === "object" && next.field && next.map) {
            const value = answers[next.field];
            return next.map[value] ?? next.map.default ?? null;
        }
    }

    // Then, try the new target-based system
    if (!node.fields || !Array.isArray(node.fields) || node.fields.length === 0) {
        return null;
    }

    // Iterate through fields to find answer-based navigation
    for (const field of node.fields) {
        if (!field || typeof field !== "object") continue;
        
        // Skip self-navigating fields (bottom_navigation, alerts)
        if (field.type === "bottom_navigation" || field.type === "alert" || field.type === "image_list" || field.type === "audio_list") {
            continue;
        }

        const fieldAnswer = answers[field.id];
        if (fieldAnswer === undefined) continue;

        // For select-like fields with options
        if (field.options && Array.isArray(field.options)) {
            for (const opt of field.options) {
                if (opt && opt.value === fieldAnswer && opt.target) {
                    return opt.target;
                }
            }
        }
        // For input fields (number_input, month_picker) with a target attribute
        else if (field.target) {
            return field.target;
        }
    }

    return null;
};

// Legacy alias for backward compatibility with tests
export const resolveNext = resolveTarget;