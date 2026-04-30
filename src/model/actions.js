/**
 * Action registry
 *
 * Actions are side-effects that can be triggered when a survey field value
 * changes. Each field in a node may carry an optional `"action"` property
 * whose value is a key in this registry.
 *
 * When the user interacts with a field (selects a value, updates a number,
 * etc.), `runAction(actionId, context)` is called with:
 *
 *   context = {
 *     fieldId  : string       – the field's id as defined in the node
 *     value    : any          – the new value chosen by the user
 *     nodeId   : string       – id of the current node
 *     answers  : object       – all answers collected so far in this step
 *   }
 *
 * To add a new action, just add a new entry below and reference its key from
 * a node field's `"action"` property in nodes.json (or the editor).
 *
 * Actions MUST NOT mutate React state — they are pure side-effects
 * (logging, localStorage writes, analytics calls, etc.).
 */

const STORAGE_PREFIX = "milc_action_";

const registry = {
    /**
     * log_value
     * Prints the field id and its new value to the console.
     * Useful for debugging node flows.
     */
    log_value: ({ fieldId, value, nodeId }) => {
        console.log(`[action:log_value] node="${nodeId}" field="${fieldId}" value=`, value);
    },

    /**
     * save_to_storage
     * Saves the field value to localStorage under the key
     * "milc_action_<nodeId>_<fieldId>".
     */
    save_to_storage: ({ fieldId, value, nodeId }) => {
        const key = `${STORAGE_PREFIX}${nodeId}_${fieldId}`;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            console.log(`[action:save_to_storage] saved "${key}" =`, value);
        } catch (err) {
            console.warn(`[action:save_to_storage] could not write to localStorage:`, err);
        }
    },

    /**
     * log_answers
     * Prints the complete current answers object for the step.
     */
    log_answers: ({ nodeId, answers }) => {
        console.log(`[action:log_answers] node="${nodeId}" answers=`, answers);
    },
};

/**
 * Run an action by id.
 * Silently ignores unknown ids so that missing actions don't crash the app.
 */
export function runAction(actionId, context) {
    if (!actionId) return;
    const fn = registry[actionId];
    if (!fn) {
        console.warn(`[actions] Unknown action id: "${actionId}"`);
        return;
    }
    fn(context);
}

/** List of all registered action ids — used by the editor to build the dropdown. */
export const ACTION_IDS = Object.keys(registry);
