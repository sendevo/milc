/**
 * Survey tree — each key is a node ID.
 *
 * All human-readable text is stored in labels.json and referenced here by key.
 * Key convention:
 *   "<nodeId>.title"                         → node title
 *   "<nodeId>.subtitle"                      → node subtitle (optional)
 *   "<nodeId>.<fieldId>.label"               → yes_no or select question text
 *   "<nodeId>.<fieldId>.message"             → alert body text
 *   "<nodeId>.<fieldId>.option.<optionValue>"→ select option label
 *
 * Node shape:
 * {
 *   id:       string,
 *   title:    string,          // key into labels.json
 *   subtitle: string,          // key into labels.json (optional)
 *   fields:   Field[],
 *   next:     null | "node-id" | { field, map }
 * }
 *
 * Field shape (type discriminated union):
 *   { id, type: "select",  label, options: [{ value, label }] }  ← labels are keys
 *   { id, type: "alert",   severity, message }                   ← message is a key
 */
import labels from "./labels.json";
import i18n from "../i18n";

/** Resolves a label key using the active i18n language. Falls back to English, then the key itself. */
export const t = (key) => {
    const lang = i18n.language ?.slice(0, 2) ?? "es";
    const entry = labels[key];
    return entry ?.[lang] ?? entry ?.en ?? key;
};

const nodes = {

    // ─── Before Milking ───────────────────────────────────────────────────────

    "before-milking-start": {
        id: "before-milking-start",
        title: "before-milking-start.title",
        subtitle: "before-milking-start.subtitle",
        showDate: true,
        icon: "shroom.png",
        fields: [{
            id: "udder_clean",
            type: "select",
            options: [
                { value: "yes", label: "yes" },
                { value: "no", label: "no" },
                { value: "dont_know", label: "dont_know" }
            ]
        }, ],
        next: {
            field: "udder_clean",
            map: {
                yes: "before-milking-start-animal-count",
                no: "before-milking-start-animal-count",
                dont_know: "before-milking-start-parlor-tip"
            }
        }
    },

    "before-milking-start-parlor-tip": {
        id: "before-milking-start-parlor-tip",
        title: "before-milking-start-parlor-tip.title",
        fields: [{
            id: "my_images",
            type: "image_list",
            images: [
                {src: "parlor_1.png"},
                {src: "milk_tanks.png"},
            ]
        }],
        next: null
    },

    "before-milking-start-animal-count": {
        id: "before-milking-start-animal-count",
        title: "before-milking-start-animal-count.title",
        subtitle: "before-milking-start-animal-count.animal_count.label",
        fields: [{
            id: "animal_count",
            type: "number_input",
            label: "before-milking-start-animal-count.animal_count.label",
            default: 1,
            min: 1,
            step: 1,
        }],
        next: null
    }
};

export default nodes;