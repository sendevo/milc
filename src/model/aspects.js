import blueGoat from "../assets/icons/blue_goat.png";
import udder from "../assets/icons/udder.png";
import milkPail from "../assets/icons/milk_pail.png";
import goatHealth from "../assets/icons/goat_health.png";
import weed from "../assets/icons/weed.png";
import cattlePen from "../assets/icons/cattle_pen.png";
import barn from "../assets/icons/barn.png";
import pest from "../assets/icons/pest.png";
import { CHECKS_BY_RATING } from "../constants";

export const normalizeCategoryKey = (value) => (value || "").toLowerCase().replace(/[-_\s]/g, "");

export const baseAspects = [
    {
        icon: blueGoat,
        label: "mainMenu.beforeMilking",
        categoryKeys: ["before-milking", "before_milking", "beforeMilking"],
        fallbackRating: 0,
    },
    {
        icon: udder,
        label: "mainMenu.duringMilking",
        categoryKeys: ["during-milking", "during_milking", "duringMilking"],
        fallbackRating: 0,
    },
    {
        icon: milkPail,
        label: "mainMenu.milkCare",
        categoryKeys: ["milk-care", "milk_care", "milkCare"],
        fallbackRating: 0,
    },
    {
        icon: goatHealth,
        label: "mainMenu.health",
        categoryKeys: ["health"],
        fallbackRating: 0,
    },
    {
        icon: weed,
        label: "mainMenu.food",
        categoryKeys: ["food", "feed"],
        fallbackRating: 0,
    },
    {
        icon: cattlePen,
        label: "mainMenu.facilities",
        categoryKeys: ["facilities"],
        fallbackRating: 0,
    },
    {
        icon: barn,
        label: "mainMenu.mySupplies",
        categoryKeys: ["supplies", "my-supplies", "my_supplies", "insumos"],
        fallbackRating: 0,
    },
    {
        icon: pest,
        label: "mainMenu.pests",
        categoryKeys: ["pests"],
        fallbackRating: 0,
    },
];

export const buildScoredAspects = (score, t) => {
    return baseAspects.map((aspect) => {
        const categoryKeySet = new Set(aspect.categoryKeys.map(normalizeCategoryKey));
        const matchedCategory = aspect.categoryKeys.find((key) => score.byCategory[key]);
        const categoryData = matchedCategory ? score.byCategory[matchedCategory] : null;
        const hasEvaluatedData = Object.values(score.byScenario).some((scenarioScore) => {
            const scenarioCategory = normalizeCategoryKey(scenarioScore.category);
            return categoryKeySet.has(scenarioCategory) && scenarioScore.expected > 0;
        });

        const rating = hasEvaluatedData && categoryData
            ? (CHECKS_BY_RATING[categoryData.rating] ?? 1)
            : aspect.fallbackRating;
        const targetView = hasEvaluatedData && categoryData
            ? categoryData.resultViewId
            : null;

        return {
            icon: aspect.icon,
            label: t(aspect.label),
            rating,
            targetView,
            key: aspect.label,
        };
    });
};
