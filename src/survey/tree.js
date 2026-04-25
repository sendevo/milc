/**
 * Survey tree — each key is a node ID.
 *
 * Node shape:
 * {
 *   id:       string,          // must match the key
 *   title:    string,          // shown in the page header
 *   fields:   Field[],         // ordered list of fields to render
 *   next:     null             // terminal — branch ends here
 *           | "node-id"        // unconditional jump
 *           | { field: "fieldId", map: { value: "node-id", default: "node-id" } }
 * }
 *
 * Field shape (type discriminated union):
 *   { id, type: "yes_no",  label }
 *   { id, type: "select",  label, options: [{ value, label }] }
 *   { id, type: "alert",   severity: "info"|"warning"|"error"|"success", message }
 */
const nodes = {

  // ─── Before Milking ───────────────────────────────────────────────────────

  "before-milking-start": {
    id: "before-milking-start",
    title: "Before Milking",
    fields: [
      {
        id: "udder_clean",
        type: "yes_no",
        label: "Are the udders clean and dry?",
      },
    ],
    next: {
      field: "udder_clean",
      map: { yes: "before-milking-pre-dip", no: "before-milking-cleaning" },
    },
  },

  "before-milking-cleaning": {
    id: "before-milking-cleaning",
    title: "Udder Cleaning",
    fields: [
      {
        id: "cleaning_reminder",
        type: "alert",
        severity: "warning",
        message:
          "Clean each teat with an individual damp cloth and dry thoroughly before proceeding.",
      },
      {
        id: "cleaned_now",
        type: "yes_no",
        label: "Have you cleaned and dried the udders?",
      },
    ],
    next: {
      field: "cleaned_now",
      map: { yes: "before-milking-pre-dip", no: "before-milking-vet-advice" },
    },
  },

  "before-milking-vet-advice": {
    id: "before-milking-vet-advice",
    title: "Veterinary Advice",
    fields: [
      {
        id: "vet_alert",
        type: "alert",
        severity: "error",
        message:
          "The animal may require veterinary attention. Do not proceed with milking and contact your vet.",
      },
    ],
    next: null,
  },

  "before-milking-pre-dip": {
    id: "before-milking-pre-dip",
    title: "Pre-Dip",
    fields: [
      {
        id: "pre_dip_done",
        type: "yes_no",
        label: "Did you apply pre-dip disinfectant?",
      },
    ],
    next: {
      field: "pre_dip_done",
      map: { yes: "before-milking-method", no: "before-milking-pre-dip-reminder" },
    },
  },

  "before-milking-pre-dip-reminder": {
    id: "before-milking-pre-dip-reminder",
    title: "Pre-Dip Reminder",
    fields: [
      {
        id: "pre_dip_info",
        type: "alert",
        severity: "info",
        message:
          "Pre-dipping reduces teat bacteria by up to 50%. Apply disinfectant, wait 30 seconds, then dry. It is strongly recommended.",
      },
    ],
    next: "before-milking-method",
  },

  "before-milking-method": {
    id: "before-milking-method",
    title: "Milking Method",
    fields: [
      {
        id: "milking_method",
        type: "select",
        label: "How will you milk today?",
        options: [
          { value: "manual", label: "Manual" },
          { value: "machine", label: "Machine" },
        ],
      },
    ],
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
    title: "Manual Milking",
    fields: [
      {
        id: "manual_tips",
        type: "alert",
        severity: "info",
        message:
          "Wash and dry your hands. Use a smooth, rhythmic motion. Ready to start.",
      },
    ],
    next: null,
  },

  "before-milking-machine-tips": {
    id: "before-milking-machine-tips",
    title: "Machine Milking",
    fields: [
      {
        id: "machine_tips",
        type: "alert",
        severity: "info",
        message:
          "Verify that the milking machine is sanitized and vacuum pressure is within range. Ready to start.",
      },
    ],
    next: null,
  },
};

export default nodes;
