import { describe, it, expect, vi } from "vitest";

// Mock i18n so the model module can be imported without a browser/firebase env
vi.mock("../../i18n", () => ({
    default: { language: "en" },
}));

import { resolveNext } from "../index.js";
import nodes from "../../survey/nodes.json";

// ─── resolveNext unit tests ───────────────────────────────────────────────────

describe("resolveNext — null next", () => {
    it("returns null for a terminal node", () => {
        const node = { id: "end", next: null };
        expect(resolveNext(node, {})).toBeNull();
    });
});

describe("resolveNext — unconditional jump", () => {
    it("returns the target node id", () => {
        const node = { id: "a", next: "b" };
        expect(resolveNext(node, {})).toBe("b");
    });

    it("ignores answers when next is a string", () => {
        const node = { id: "a", next: "c" };
        expect(resolveNext(node, { someField: "yes" })).toBe("c");
    });
});

describe("resolveNext — field map", () => {
    const node = {
        id: "q",
        next: {
            field: "answer",
            map: {
                yes: "node-yes",
                no: "node-no",
                default: "node-default",
            },
        },
    };

    it("resolves to the mapped node for a known answer", () => {
        expect(resolveNext(node, { answer: "yes" })).toBe("node-yes");
        expect(resolveNext(node, { answer: "no" })).toBe("node-no");
    });

    it("falls back to default when answer is not in the map", () => {
        expect(resolveNext(node, { answer: "maybe" })).toBe("node-default");
    });

    it("falls back to default when answer is missing", () => {
        expect(resolveNext(node, {})).toBe("node-default");
    });
});

describe("resolveNext — field map without default", () => {
    const node = {
        id: "q",
        next: {
            field: "answer",
            map: { yes: "node-yes" },
        },
    };

    it("returns null when answer is not in map and no default exists", () => {
        expect(resolveNext(node, { answer: "no" })).toBeNull();
    });

    it("returns null when answer is missing and no default exists", () => {
        expect(resolveNext(node, {})).toBeNull();
    });
});

// ─── Tree traversal helper ────────────────────────────────────────────────────

/**
 * Simulates walking the survey tree by repeatedly resolving the next node.
 * Returns an ordered array of visited node IDs (including the start node).
 * Stops when it reaches a terminal node or a node not found in the tree.
 *
 * @param {object} nodeMap   - The full node map (id → node)
 * @param {string} startId   - The ID of the entry-point node
 * @param {object[]} steps   - Array of answer objects, one per node visited
 * @returns {string[]}       - Sequence of visited node IDs
 */
function walkTree(nodeMap, startId, steps) {
    const visited = [];
    let currentId = startId;
    let stepIndex = 0;

    while (currentId && nodeMap[currentId]) {
        visited.push(currentId);
        const node = nodeMap[currentId];
        const answers = steps[stepIndex] ?? {};
        stepIndex++;
        currentId = resolveNext(node, answers);
    }

    return visited;
}

// ─── Traversal tests with nodes.json ─────────────────────────────────────────

describe("nodes.json tree traversal", () => {
    it("answer 'yes' → before-milking-start → before-milking-start-animal-count (terminal)", () => {
        const path = walkTree(nodes, "before-milking-start", [{ udder_clean: "yes" }]);
        expect(path).toEqual([
            "before-milking-start",
            "before-milking-start-animal-count",
        ]);
    });

    it("answer 'no' → before-milking-start → before-milking-start-animal-count (terminal)", () => {
        const path = walkTree(nodes, "before-milking-start", [{ udder_clean: "no" }]);
        expect(path).toEqual([
            "before-milking-start",
            "before-milking-start-animal-count",
        ]);
    });

    it("answer 'dont_know' → before-milking-start → before-milking-start-parlor-tip (terminal)", () => {
        const path = walkTree(nodes, "before-milking-start", [{ udder_clean: "dont_know" }]);
        expect(path).toEqual([
            "before-milking-start",
            "before-milking-start-parlor-tip",
        ]);
    });

    it("before-milking-start-parlor-tip is a terminal node", () => {
        const node = nodes["before-milking-start-parlor-tip"];
        expect(resolveNext(node, {})).toBeNull();
    });

    it("before-milking-start-animal-count is a terminal node", () => {
        const node = nodes["before-milking-start-animal-count"];
        expect(resolveNext(node, {})).toBeNull();
    });
});

// ─── Generic tree integrity checks ───────────────────────────────────────────

describe("nodes.json integrity", () => {
    it("all nodes have a non-empty id", () => {
        Object.values(nodes).forEach((node) => {
            expect(node.id).toBeTruthy();
        });
    });

    it("all node ids match their map key", () => {
        Object.entries(nodes).forEach(([key, node]) => {
            expect(node.id).toBe(key);
        });
    });

    it("all direct next targets exist in the node map", () => {
        Object.values(nodes).forEach((node) => {
            if (typeof node.next === "string") {
                expect(nodes[node.next], `target "${node.next}" not found`).toBeDefined();
            }
        });
    });

    it("all field-map next targets exist in the node map", () => {
        Object.values(nodes).forEach((node) => {
            if (node.next && typeof node.next === "object" && node.next.map) {
                Object.entries(node.next.map).forEach(([key, target]) => {
                    if (key !== "default" || target) {
                        expect(nodes[target], `target "${target}" not found`).toBeDefined();
                    }
                });
            }
        });
    });

    it("nodes with no fields array do not crash resolveNext", () => {
        const bare = { id: "bare", fields: [], next: null };
        expect(resolveNext(bare, {})).toBeNull();
    });
});
