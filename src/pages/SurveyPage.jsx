import { useNavigate, useParams } from "react-router-dom";
import nodes from "../survey/nodes.json";
import { resolveNext } from "../model";
import SurveyStep from "../components/survey/SurveyStep";

/**
 * Route: /survey/:nodeId
 *
 * - Reads nodeId from the URL.
 * - Looks up the node in the tree.
 * - On submit, resolves the next node and navigates there.
 *   If the branch ends (next: null) or the node is unknown, returns to /app.
 */
const SurveyPage = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();

    const node = nodes[nodeId];

    if (!node) {
        navigate("/app", { replace: true });
        return null;
    }

    const handleSubmit = (answers) => {
        const nextId = resolveNext(node, answers);
        navigate(nextId ? `/survey/${nextId}` : "/app");
    };

    return (
        <SurveyStep
            key={node.id}
            node={node}
            onSubmit={handleSubmit}
            onBack={() => navigate(-1)} />
    );
};

export default SurveyPage;
