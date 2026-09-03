import fallbackNodes from "../survey/nodes.json";

/**
 * Returns the bundled survey node map.
 *
 * `src/survey/nodes.json` is the only source of truth for navigation and field
 * definitions.
 */
export function useSurveyNodes() {
    return fallbackNodes;
}
