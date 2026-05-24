import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { resolveTarget } from "../model";
import { useSurveyLog } from "../hooks/useSurveyLog";
import SurveyStep from "../components/survey/SurveyStep";
import { useToast } from "../contexts/ToastContext";

/**
 * Route: /survey/:nodeId
 *
 * - Reads nodeId from the URL.
 * - Looks up the node in the tree.
 * - On submit, if the node is scoreable, persists the answer to the log.
 * - Resolves the target node and navigates to it.
 *   If the branch ends (no target) or the node is unknown, returns to /app.
 *
 * A node is scoreable when ALL of the following fields are present:
 *   - scenario   (not "-")
 *   - score-answer
 *   - severity
 *   - periodicity
 *   - category
 *
 * The answer that gets logged is the value of the first `select` field
 * in the node that has an answer in the submitted answers map.
 */
const SurveyPage = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const nodes = useSurveyNodes();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { saveAnswer } = useSurveyLog();

    const node = nodes[nodeId];

    useEffect(() => {
        if (!import.meta.env.DEV) return;
        if (node) {
            console.log("[survey] current node:", nodeId);
            return;
        }
        console.log("[survey] unknown node id:", nodeId);
    }, [nodeId, node]);

    useEffect(() => {
        if (node) return;
        showToast(t("survey.inDevelopment"));
        navigate("/app", { replace: true });
    }, [navigate, node, showToast, t]);

    if (!node) {
        return null;
    }

    // ---------------------------------------------------------------------------
    // Determine whether this node should be scored.
    // ---------------------------------------------------------------------------
    const isScoreable =
        node.scenario &&
        node.scenario !== "-" &&
        node["score-answer"] &&
        node.severity &&
        node.periodicity &&
        node.category;

    /**
     * Extracts the relevant answer value from the submitted answers map.
     *
     * Looks for the first `select` field whose id has an entry in `answers`.
     * Returns undefined if no matching field/answer is found.
     *
     * @param {object} answers - Map of fieldId → answer value
     * @returns {string|undefined}
     */
    const extractAnswer = (answers) => {
        if (!node.fields) return undefined;
        for (const field of node.fields) {
            if (field.type === "select" && answers[field.id] !== undefined) {
                return answers[field.id];
            }
        }
        return undefined;
    };

    // ---------------------------------------------------------------------------
    // Submit handler
    // ---------------------------------------------------------------------------
    const handleSubmit = (answers) => {
        // 1. Persist the answer if this is a scoreable node.
        if (isScoreable) {
            const answer = extractAnswer(answers);
            if (answer !== undefined) {
                saveAnswer(nodeId, node.scenario, answer);

                if (import.meta.env.DEV) {
                    console.log("[survey] logged answer:", {
                        nodeId,
                        scenario: node.scenario,
                        answer,
                    });
                }
            }
        }

        // 2. Navigate to the next node (unchanged from original logic).
        const targetId = resolveTarget(node, answers);
        const targetNode = targetId ? nodes[targetId] : null;

        if (import.meta.env.DEV) {
            console.log("[survey] target view:", targetId ?? "/app");
        }

        if (targetId && !targetNode) {
            showToast(t("survey.inDevelopment"));
            navigate("/app");
            return;
        }

        navigate(targetId ? `/survey/${targetId}` : "/app");
    };

    return (
        <SurveyStep
            key={nodeId}
            nodeId={nodeId}
            node={node}
            onSubmit={handleSubmit}
            onBack={() => navigate(-1)}
        />
    );
};

export default SurveyPage;
