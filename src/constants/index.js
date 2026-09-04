import packageJson from "../../package.json";

export const APP_VERSION = import.meta.env.APP_VERSION;
export const APP_VERSION_FALLBACK = packageJson.version;
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export const DEV_TOOLS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === "true";

export const STORAGE_KEY_LANG = "milc_language";
export const STORAGE_KEY_THEME = "milc_theme";
export const STORAGE_KEY_SIMULATED_DATE = "milc_simulated_date";

export const SURVEY_LOG_STORAGE_KEY = "milc_survey_log";
export const SURVEY_LOG_RECORD_SCHEMA_VERSION = 1;

export const HERD_INVENTORY_STORAGE_KEY = "milc_herd_inventory_log";
export const HERD_INVENTORY_SCHEMA_VERSION = 1;
export const HERD_INVENTORY_NODE_TYPES = {
    "view-add-animals": "add",
    "view-remove-animals": "remove",
    "view-dead-animals": "death",
};

export const TELEMETRY_QUEUE_KEY = "milc_telemetry_queue_v1";
export const TELEMETRY_SENT_IDS_KEY = "milc_telemetry_sent_ids_v1";
export const TELEMETRY_SCHEMA_VERSION = 1;
export const FLUSH_BATCH_SIZE = 20;
export const MAX_SENT_IDS = 2000;
export const MAX_QUEUED_EVENTS = 1000;
export const FLUSH_AGE_MS = 3 * 60 * 1000;

export const LOCAL_SCHEMA_VERSION_KEY = "milc_schema_version";
export const CURRENT_LOCAL_SCHEMA_VERSION = 1;

export const CURRENT_PROFILE_SCHEMA_VERSION = 1;

export const DEFAULT_MODAL_STATE = {
    open: false,
    title: "",
    content: null,
    actions: [],
    onClose: null,
    disableClose: false,
    maxWidth: "sm",
    fullWidth: true,
    formValues: {},
};

export const NON_NODE_TARGET_ROUTES = {
    home: "/home",
    profile: "/profile",
};

export const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export const DEFAULT_GRADIENTS = [
    { from: "#2dc5a2", to: "#1a8090" },
    { from: "#74b3ff", to: "#2f6ad9" },
    { from: "#f6c344", to: "#d18b00" },
    { from: "#f28b82", to: "#d24a43" },
];

export const SCENARIO_DEFAULTS = {
    "PREORD-01": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-02": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-03": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-04": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-05": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-06": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-07": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "PREORD-08": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "before-milking" },
    "ORD-02-03": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "during-milking" },
    "ORD-07": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "during-milking" },
    "HEALTH-01": { correctAnswer: "no", severity: 3, periodicity: "daily", category: "health" },
    "FEED-01": { correctAnswer: "yes", severity: 3, periodicity: "daily", category: "food" },
    "FACIL-01": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "facilities" },
    "FACIL-02": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "facilities" },
    "FACIL-03": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "facilities" },
    "SUPPLY-01": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "supplies" },
    "SUPPLY-02": { correctAnswer: "yes", severity: 3, periodicity: "semester", category: "supplies" },
};

export const PROFILE_SETUP_CONFLICTING_NODE_IDS = {
    "view-produce-year-round": new Set(["view-produce-year-round", "view-217", "view-milking-calendar", "view-218"]),
    "view-milking-calendar": new Set(["view-milking-calendar", "view-218", "view-produce-year-round", "view-217"]),
};

export const CHECKS_BY_RATING = {
    excellent: 4,
    "very-good": 3,
    regular: 2,
    "needs-improvement": 1,
};

export const TOTAL_ANIMALS_NODE_IDS = ["view-animal-count"];
export const MILKED_ANIMALS_NODE_IDS = ["view-235", "view-36"];
export const MILK_LITERS_NODE_ID = "view-55";
export const MASTITIS_NODE_IDS = ["view-236", "view-42", "view-189"];

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const VALIDATION_SEVERITY = {
    warning: "warning",
    error: "error",
};

export const ACTION_IDS = ["log_value", "save_to_storage", "log_answers"];

export const STORAGE_PREFIX = "milc_action_";

export const USAGE_KEYS = [
    SURVEY_LOG_STORAGE_KEY,
    HERD_INVENTORY_STORAGE_KEY,
    TELEMETRY_QUEUE_KEY,
    TELEMETRY_SENT_IDS_KEY,
];

export const USAGE_KEY_PREFIXES = [STORAGE_PREFIX];

export const PAGE_MARGIN_X = 14;
export const KEY_VALUE_VALUE_X = 84;
export const HEADER_HEIGHT = 28;
export const CONTENT_TOP = HEADER_HEIGHT + 8;
export const CONTENT_BOTTOM = 16;
export const SCALE_ICON_SIZE = 4;
export const SCALE_ICON_GAP = 1.8;
