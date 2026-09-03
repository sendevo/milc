import View223 from "../View223";

/**
 * Special survey views mapping and retrieval function.
 * Procedure to create special views:
 * 1. Create a new view component in the `src/pages` directory.
 * 2. Import the new view component here.
 * 3. Add an entry to the `SPECIAL_SURVEY_VIEWS` object with the view's node ID as the key and the component as the value.
 * 4. Use the `getSpecialSurveyView` function to retrieve and render the special view component based on its node ID.
 * 5. Ensure the node ID used in the `SPECIAL_SURVEY_VIEWS` object matches the one used when retrieving the view.
 * Example:
 * const SpecialView = getSpecialSurveyView("view-223");
 * if (SpecialView) {
 *     // Render the special view component
 * }
 */

const specialSurveyViews = {
    "view-223": {
        component: View223,
        exportMeta: {
            title: {
                en: "Milk conditioning",
                es: "Acondicionar la leche",
            },
            subtitle: {
                en: "Label the container",
                es: "Rotular el envase",
            },
        },
    },
};

export const getSpecialSurveyView = (nodeId) => specialSurveyViews[nodeId]?.component || null;

export const getSpecialSurveyViewExportMeta = (nodeId) => specialSurveyViews[nodeId]?.exportMeta || null;
