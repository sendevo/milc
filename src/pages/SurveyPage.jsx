import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSurveyNodes } from "../hooks/useSurveyNodes";
import { resolveTarget } from "../model";
import SurveyStep from "../components/survey/SurveyStep";
import { useToast } from "../contexts/ToastContext";

/**
 * Route: /survey/:nodeId
 *
 * - Reads nodeId from the URL.
 * - Looks up the node in the tree.
 * - On submit, resolves the target node using field option targets.
 *   If the branch ends (no target) or the node is unknown, returns to /app.
 */
const SurveyPage = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const nodes = useSurveyNodes();
    const { showToast } = useToast();
    const { t } = useTranslation();

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

    const handleSubmit = (answers) => {
        const targetId = resolveTarget(node, answers);
        const targetNode = targetId ? nodes[targetId] : null;
        console.log("[survey] target view:", targetId ?? "/app");
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
            onBack={() => navigate(-1)} />
    );
};

export default SurveyPage;
