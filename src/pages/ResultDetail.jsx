import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SurveyStep from "../components/survey/SurveyStep";
import { useResultScore } from "../hooks/useResultScore";
import { getCategoryRecommendations } from "../model/aspects";

const RECOMMENDATIONS_FIELD_ID = "recommendations";
// Stable reference: SurveyStep resets its answers whenever initialAnswers changes
const NO_ANSWERS = {};

/**
 * ResultDetail — result screen for a single category (e.g. "before-milking").
 *
 * Shows the rating header and danger index text from the generic result node
 * (view-result-*), followed by one button per recommendation of the category
 * questions that were not performed correctly. Each button opens the question
 * guide view; its "back" actions return here.
 */
const ResultDetail = () => {
    const { category } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const { score, nodes } = useResultScore(fromDate, toDate);

    const categoryData = score.byCategory[category];
    const resultNodeId = categoryData?.resultViewId;
    const resultNode = resultNodeId ? nodes[resultNodeId] : null;

    const node = useMemo(() => {
        if (!resultNode) return null;

        const recommendations = getCategoryRecommendations(score, nodes, category);
        const fields = resultNode.fields.filter((field) => field.type !== "select");

        if (recommendations.length > 0) {
            fields.push({
                id: RECOMMENDATIONS_FIELD_ID,
                type: "select",
                options: recommendations.map((r) => ({
                    value: r.targetView,
                    label: r.label,
                })),
            });
        }

        return { ...resultNode, fields, next: null };
    }, [resultNode, score, nodes, category]);

    // Records are loaded asynchronously: render nothing until the category score exists
    if (!node) return null;

    const handleSubmit = (answers) => {
        const targetView = answers[RECOMMENDATIONS_FIELD_ID];
        if (targetView) {
            navigate(`/survey/${targetView}`, { state: { resultsDepth: 1 } });
            return;
        }
        navigate(-1);
    };

    return (
        <SurveyStep
            key={`${category}-${resultNodeId}`}
            nodeId={resultNodeId}
            node={node}
            initialAnswers={NO_ANSWERS}
            onSubmit={handleSubmit}
            onBack={() => navigate(-1)}
        />
    );
};

export default ResultDetail;
