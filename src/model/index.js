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
 * The `resolveNext` function takes a survey node and the current answers, and
 * determines the ID of the next node in the survey flow based on the node's
 * `next` field. This field can be a string for unconditional jumps or an object
 * for conditional branching based on a specific answer.
 * A node's `next` field can be:
     *   - null                                  → terminal node (end of branch)
     *   - "some-node-id"                        → unconditional jump
     *   - { field: "fieldId", map: { value: "nodeId", default: "nodeId" } }
     *                                           → conditional branching on one field
     *
     * Returns the next node ID string, or null if the branch is finished.
 */

import i18n from "../i18n";

export const t = (text) => {
    const lang = i18n.language?.slice(0, 2) ?? "es";
    if (text && typeof text === "object") {
        return text[lang] ?? text.en ?? "";
    }
    return text ?? "";
};

export const resolveNext = (node, answers) => {
    const { next } = node;
    if (!next) return null;
    if (typeof next === "string") return next;
    const value = answers[next.field];
    return next.map[value] ?? next.map.default ?? null;
}