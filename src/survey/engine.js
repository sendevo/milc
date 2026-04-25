/**
 * Resolves the next node ID given the current node and submitted answers.
 *
 * A node's `next` field can be:
 *   - null                                  → terminal node (end of branch)
 *   - "some-node-id"                        → unconditional jump
 *   - { field: "fieldId", map: { value: "nodeId", default: "nodeId" } }
 *                                           → conditional branching on one field
 *
 * Returns the next node ID string, or null if the branch is finished.
 */
export function resolveNext(node, answers) {
  const { next } = node;
  if (!next) return null;
  if (typeof next === "string") return next;
  const value = answers[next.field];
  return next.map[value] ?? next.map.default ?? null;
}
