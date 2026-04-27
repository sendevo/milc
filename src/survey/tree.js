/**
 * Survey tree — each key is a node ID.
 *
 * All human-readable text is stored in labels.json and referenced here by key.
 * Key convention:
 *   "<nodeId>.title"                         → node title
 *   "<nodeId>.<fieldId>.label"               → yes_no or select question text
 *   "<nodeId>.<fieldId>.message"             → alert body text
 *   "<nodeId>.<fieldId>.option.<optionValue>"→ select option label
 *
 * Node shape:
 * {
 *   id:       string,
 *   title:    string,          // key into labels.json
 *   fields:   Field[],
 *   next:     null | "node-id" | { field, map }
 * }
 *
 * Field shape (type discriminated union):
 *   { id, type: "yes_no",  label }                               ← label is a key
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
        fields: [{
            id: "udder_clean",
            type: "yes_no",
            label: "before-milking-start.udder_clean.label",
        }, ],
        next: {
            field: "udder_clean",
            map: {
                yes: "before-milking-pre-dip",
                no: "before-milking-cleaning"
            },
        },
    },

    "before-milking-cleaning": {
        id: "before-milking-cleaning",
        title: "before-milking-cleaning.title",
        fields: [{
                id: "cleaning_reminder",
                type: "alert",
                severity: "warning",
                message: "before-milking-cleaning.cleaning_reminder.message",
            },
            {
                id: "cleaned_now",
                type: "yes_no",
                label: "before-milking-cleaning.cleaned_now.label",
            },
        ],
        next: {
            field: "cleaned_now",
            map: {
                yes: "before-milking-pre-dip",
                no: "before-milking-vet-advice"
            },
        },
    },

    "before-milking-vet-advice": {
        id: "before-milking-vet-advice",
        title: "before-milking-vet-advice.title",
        fields: [{
            id: "vet_alert",
            type: "alert",
            severity: "error",
            message: "before-milking-vet-advice.vet_alert.message",
        }, ],
        next: null,
    },

    "before-milking-pre-dip": {
        id: "before-milking-pre-dip",
        title: "before-milking-pre-dip.title",
        fields: [{
            id: "pre_dip_done",
            type: "yes_no",
            label: "before-milking-pre-dip.pre_dip_done.label",
        }, ],
        next: {
            field: "pre_dip_done",
            map: {
                yes: "before-milking-method",
                no: "before-milking-pre-dip-reminder"
            },
        },
    },

    "before-milking-pre-dip-reminder": {
        id: "before-milking-pre-dip-reminder",
        title: "before-milking-pre-dip-reminder.title",
        fields: [{
            id: "pre_dip_info",
            type: "alert",
            severity: "info",
            message: "before-milking-pre-dip-reminder.pre_dip_info.message",
        }, ],
        next: "before-milking-method",
    },

    "before-milking-method": {
        id: "before-milking-method",
        title: "before-milking-method.title",
        fields: [{
            id: "milking_method",
            type: "select",
            label: "before-milking-method.milking_method.label",
            options: [{
                    value: "manual",
                    label: "before-milking-method.milking_method.option.manual"
                },
                {
                    value: "machine",
                    label: "before-milking-method.milking_method.option.machine"
                },
            ],
        }, ],
        next: {
            field: "milking_method",
            map: {
                manual: "before-milking-manual-tips",
                machine: "before-milking-machine-tips",
            },
        },
    },

    "before-milking-manual-tips": {
        id: "before-milking-manual-tips",
        title: "before-milking-manual-tips.title",
        fields: [{
            id: "manual_tips",
            type: "alert",
            severity: "info",
            message: "before-milking-manual-tips.manual_tips.message",
        }, ],
        next: null,
    },

    "before-milking-machine-tips": {
        id: "before-milking-machine-tips",
        title: "before-milking-machine-tips.title",
        fields: [{
            id: "machine_tips",
            type: "alert",
            severity: "info",
            message: "before-milking-machine-tips.machine_tips.message",
        }, ],
        next: null,
    },
};

export default nodes;