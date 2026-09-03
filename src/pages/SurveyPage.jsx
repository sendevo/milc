import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { resolveTarget } from "../model";
import { useSurveyLog } from "../hooks/useSurveyLog";
import { useHerdInventory } from "../hooks/useHerdInventory";
import SurveyStep from "../components/survey/SurveyStep";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { validateSurveySubmission } from "../model/validation";
import { formatAsIsoDate } from "../utils/dateTime";
import {
    buildTelemetryEvent,
    enqueueTelemetryEvent,
    flushTelemetryQueue,
} from "../telemetry/telemetryQueue";
import packageJson from "../../package.json";
import { getSpecialSurveyView } from "./specialViews";
import {
    getHerdInventoryRecordForNodeAndDate,
    getHerdInventoryTypeForNode,
    isHerdInventoryNode,
} from "../utils/herdInventory";

const APP_VERSION_FALLBACK = packageJson.version;

const NON_NODE_TARGET_ROUTES = {
    home: "/home",
    profile: "/profile"
};

const resolveNonNodeTargetRoute = (targetId) => {
    if (!targetId) return null;

    if (NON_NODE_TARGET_ROUTES[targetId]) {
        return NON_NODE_TARGET_ROUTES[targetId];
    }

    // Allow direct route targets as an escape hatch for future nodes.
    if (targetId.startsWith("/")) {
        return targetId;
    }

    return null;
};

/**
 * Route: /survey/:nodeId
 *
 * - Reads nodeId from the URL.
 * - Looks up the node in the tree.
 * - On submit, if the node has a real scenario, persists the answer to the log.
 * - Resolves the target node and navigates to it.
 *   If the branch ends (no target) or the node is unknown, returns to /home.
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
    const { saveAnswer, getRecords } = useSurveyLog();
    const { saveTransaction, getRecords: getInventoryRecords } = useHerdInventory();
    const { currentUser } = useAuth();
    const { getCurrentDateTime } = useSettings();

    const node = nodes[nodeId];
    const SpecialSurveyView = getSpecialSurveyView(nodeId);
    const currentDate = formatAsIsoDate(getCurrentDateTime());

    useEffect(() => {
        if (!import.meta.env.DEV) return;
        if (SpecialSurveyView) {
            console.log("[survey] special view:", nodeId);
            return;
        }
        if (node) {
            console.log("[survey] current node:", nodeId);
            return;
        }
        console.log("[survey] unknown node id:", nodeId);
    }, [nodeId, node, SpecialSurveyView]);

    useEffect(() => {
        if (node || SpecialSurveyView) return;
        //showToast(t("survey.inDevelopment"));
        //navigate("/home", { replace: true });
        navigate("/error", { replace: true });
    }, [navigate, node, showToast, t, SpecialSurveyView]);

    // ---------------------------------------------------------------------------
    // Determine whether this node should be logged.
    // ---------------------------------------------------------------------------
    const isTrackable =
        node?.scenario &&
        node.scenario !== "-";
    const isHerdInventoryTracked = isHerdInventoryNode(nodeId);

    const storableField = useMemo(() => {
        if (!node?.fields) return null;
        return node.fields.find(
            (field) =>
                field.type === "select" ||
                field.type === "number_input" ||
                field.type === "month_picker" ||
                field.type === "date_picker",
        ) || null;
    }, [node]);

    const initialAnswers = useMemo(() => {
        if (!storableField) {
            return {};
        }

        if (isHerdInventoryTracked) {
            const latestInventoryRecord = getHerdInventoryRecordForNodeAndDate(
                getInventoryRecords(),
                nodeId,
                currentDate,
            );

            if (latestInventoryRecord && latestInventoryRecord.count !== undefined && latestInventoryRecord.count !== null) {
                return { [storableField.id]: latestInventoryRecord.count };
            }

            return {};
        }

        if (!isTrackable) {
            return {};
        }

        const latestRecord = getRecords()
            .filter((record) => record.nodeId === nodeId && record.scenario === node.scenario)
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (!latestRecord || latestRecord.answer === undefined || latestRecord.answer === null) {
            return {};
        }

        return { [storableField.id]: latestRecord.answer };
    }, [currentDate, getInventoryRecords, getRecords, isHerdInventoryTracked, isTrackable, node?.scenario, nodeId, storableField]);

    if (SpecialSurveyView) {
        return <SpecialSurveyView nodeId={nodeId} />;
    }

    if (!node) {
        return null;
    }

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
        const validationResult = validateSurveySubmission({
            nodeId,
            answers,
            records: getRecords(),
            inventoryRecords: getInventoryRecords(),
            currentDate,
            t,
        });

        if (!validationResult.isValid) {
            showToast(validationResult.message, validationResult.severity);
            return;
        }

        const answer = extractAnswer(answers);

        // 1. Persist the answer if this node has a scoreable scenario code.
        if (answer !== undefined) {
            if (isTrackable) {
                saveAnswer(nodeId, node.scenario, answer, {
                    date: currentDate,
                });

                if (import.meta.env.DEV) {
                    console.log("[survey] logged answer:", {
                        nodeId,
                        scenario: node.scenario,
                        answer,
                    });
                }
            }

            if (isHerdInventoryTracked) {
                const type = getHerdInventoryTypeForNode(nodeId);
                saveTransaction(nodeId, type, answer, { date: currentDate });
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
            console.log("[survey] target view:", targetId ?? "/home");
        }

        if (targetId && !targetNode) {
            const targetSpecialView = getSpecialSurveyView(targetId);
            if (targetSpecialView) {
                navigate(`/survey/${targetId}`);
                return;
            }

            const targetRoute = resolveNonNodeTargetRoute(targetId);
            if (targetRoute) {
                navigate(targetRoute);
                return;
            }

            //showToast(t("survey.inDevelopment"));
            //navigate("/home");
            navigate("/error", { replace: true });
            return;
        }

        navigate(targetId ? `/survey/${targetId}` : "/home");
    };

    return (
        <SurveyStep
            key={nodeId}
            nodeId={nodeId}
            node={node}
            initialAnswers={initialAnswers}
            onSubmit={handleSubmit}
            onBack={() => navigate(-1)}
        />
    );
};

export default SurveyPage;
