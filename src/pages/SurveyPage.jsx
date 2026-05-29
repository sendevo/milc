import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { resolveTarget } from "../model";
import { useSurveyLog } from "../hooks/useSurveyLog";
import SurveyStep from "../components/survey/SurveyStep";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import {
    buildTelemetryEvent,
    enqueueTelemetryEvent,
    flushTelemetryQueue,
} from "../telemetry/telemetryQueue";
import packageJson from "../../package.json";

const APP_VERSION_FALLBACK = packageJson.version;

/**
 * Route: /survey/:nodeId
 *
 * - Reads nodeId from the URL.
 * - Looks up the node in the tree.
 * - On submit, if the node has a real scenario, persists the answer to the log.
 * - Resolves the target node and navigates to it.
 *   If the branch ends (no target) or the node is unknown, returns to /app.
 *
 * A node is trackable when it has a real scenario (scenario !== "-").
 * Scoring metadata (score-answer, severity, periodicity, category) is used
 * later by scoring.js, but should not prevent answer logging.
 *
 * The answer that gets logged is the value of the first `select` field
 * in the node that has an answer in the submitted answers map.
 */
const SurveyPage = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const nodes = useSurveyNodes();
    const { showToast } = useToast();
    const { t, i18n } = useTranslation();
    const { saveAnswer } = useSurveyLog();
    const { currentUser } = useAuth();

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
    // Determine whether this node should be logged.
    // ---------------------------------------------------------------------------
    const isTrackable =
        node.scenario &&
        node.scenario !== "-";

    /**
     * Extracts the relevant answer value from the submitted answers map.
     *
     * Handles select (string), number_input (number), and month_picker (number[]).
     * Returns undefined if no matching field/answer is found.
     *
     * @param {object} answers - Map of fieldId → answer value
     * @returns {string|number|number[]|undefined}
     */
    const extractAnswer = (answers) => {
        if (!node.fields) return undefined;
        for (const field of node.fields) {
            if (
                (field.type === "select" ||
                 field.type === "number_input" ||
                 field.type === "month_picker") &&
                answers[field.id] !== undefined
            ) {
                return answers[field.id];
            }
        }
        return undefined;
    };

    // ---------------------------------------------------------------------------
    // Submit handler
    // ---------------------------------------------------------------------------
    const handleSubmit = (answers) => {
        const answer = extractAnswer(answers);

        // 1. Persist the answer if this node has a scoreable scenario code.
        if (answer !== undefined) {
            if (isTrackable) {
                saveAnswer(nodeId, node.scenario, answer);

                if (import.meta.env.DEV) {
                    console.log("[survey] logged answer:", {
                        nodeId,
                        scenario: node.scenario,
                        answer,
                    });
                }
            }

            const normalizedAnswer = typeof answer === "string"
                ? answer.trim().toLowerCase()
                : answer;

            const scoreAnswer = typeof node["score-answer"] === "string"
                ? node["score-answer"].trim().toLowerCase()
                : null;

            const isCorrect = scoreAnswer
                ? normalizedAnswer === scoreAnswer
                : null;

            const telemetryEvent = buildTelemetryEvent({
                uid: currentUser?.uid,
                nodeId,
                scenario: node.scenario,
                category: node.category,
                answer,
                isCorrect,
                severity: node.severity,
                periodicity: node.periodicity,
                language: i18n.language,
                appVersion: import.meta.env.VITE_APP_VERSION || APP_VERSION_FALLBACK,
            });

            void enqueueTelemetryEvent(telemetryEvent)
                .then(() => flushTelemetryQueue())
                .catch(() => {
                    // Telemetry failures are non-blocking for survey flow.
                });
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
