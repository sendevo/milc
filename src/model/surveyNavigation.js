/**
 * Structural "back" navigation for the survey header arrow.
 *
 * The header arrow goes to the previous step of the flow (the screen the user
 * came from among the screens that lead to the current one), never to whatever
 * screen was seen last. Each forward navigation carries a `trail` of visited
 * views in the router state, so the arrow knows which of several possible
 * previous steps was actually used.
 */

// First screen of each section, and where its back arrow goes
export const SURVEY_ENTRY_BACK_ROUTES = {
    "view-109": "/home",
    "view-124": "/home",
    "view-243": "/home",
    "view-129": "/home",
    "view-177": "/home",
    "view-184": "/home",
    "view-196": "/home",
    "view-206": "/home",
    "view-213": "/home",
    "view-produce-year-round": "/profile",
};

const INPUT_FIELD_TYPES = new Set(["select", "number_input", "month_picker", "date_picker"]);

const isQuestion = (node) => (node?.fields || []).some((field) => INPUT_FIELD_TYPES.has(field.type));

/**
 * Builds a map nodeId → Set of the views that lead to it (answer options,
 * forward buttons, number input targets, next and next-by-method). "Back"
 * buttons are not forward steps and are left out.
 */
export const buildSurveyParents = (nodes) => {
    const parents = {};
    const add = (target, from) => {
        if (!target || target === from) return;
        (parents[target] ??= new Set()).add(from);
    };

    for (const [id, node] of Object.entries(nodes)) {
        if (!id.startsWith("view-") || typeof node !== "object") continue;
        for (const field of node.fields || []) {
            for (const option of field.options || []) add(option.target, id);
            for (const button of field.buttons || []) {
                if (button.label?.en === "Back") continue;
                add(button.target, id);
            }
            add(field.target, id);
        }
        if (typeof node.next === "string") add(node.next, id);
        for (const target of Object.values(node["next-by-method"] || {})) add(target, id);
    }
    return parents;
};

/**
 * Resolves where the header arrow of a survey view goes.
 *
 * @returns {{ route: string } | { view: string, trail: string[] }}
 */
export const resolveSurveyBack = (nodeId, trail, parents, nodes) => {
    if (SURVEY_ENTRY_BACK_ROUTES[nodeId]) {
        return { route: SURVEY_ENTRY_BACK_ROUTES[nodeId] };
    }

    const candidates = [...(parents[nodeId] || [])];

    // The step the user actually came from, when it is one of the possible previous steps
    const lastVisited = trail[trail.length - 1];
    if (lastVisited && candidates.includes(lastVisited)) {
        return { view: lastVisited, trail: trail.slice(0, -1) };
    }

    // No trail (e.g. the page was reloaded): prefer a question over an alert or guide
    const fallback = candidates.find((id) => isQuestion(nodes[id])) || candidates[0];
    return fallback ? { view: fallback, trail: [] } : { route: "/home" };
};
