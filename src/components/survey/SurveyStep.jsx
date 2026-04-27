import { useState, Fragment } from "react";
import { Box, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ViewContainer from "../ViewContainer";
import Select from "./Select";
import AlertBlock from "./AlertBlock";
import NumberInput from "./NumberInput";
import ImageList from "./ImageList";
import MonthPicker from "./MonthPicker";
import { t } from "../../survey/tree";
import { surveyStepStyles as styles } from "../../theme/SurveyStep.styles";

/**
 * Renders a single survey node.
 *
 * Auto-advance rule: if the node has exactly one input field and it is a
 * yes_no, tapping Yes/No immediately calls onSubmit — no extra button needed.
 * In all other cases a "Siguiente / Finalizar" button is shown.
 *
 * Props:
 *   node     — a node object from src/survey/tree.js
 *   onSubmit — (answers: object) => void  called when the step is complete
 *   onBack   — () => void                 optional back navigation handler
 */

const inputFieldTypes = ["select", "number_input", "month_picker"];

const SurveyStep = ({ node, onSubmit, onBack }) => {
    const [answers, setAnswers] = useState({});
    const navigate = useNavigate();
    const { t: tUI } = useTranslation();

    // Extract input fields (exclude alerts) to determine auto-advance and completion.
    const inputFields = node.fields.filter((f) => inputFieldTypes.includes(f.type));

    const autoAdvance = inputFields.length === 1 &&
        (inputFields[0].type === "select" || inputFields[0].type === "number_input");

    const isComplete = inputFields.every((f) => answers[f.id] !== undefined);

    const renderField = (field) => {
        switch (field.type) {
            case "select":
                return (
                    <Select
                        key={field.id}
                        options={field.options.map((o) => ({
                            value: o.value,
                            label: t(o.label)
                        }))}
                        onSelect={(value) => {
                            const newAnswers = { ...answers, [field.id]: value };
                            setAnswers(newAnswers);
                            if (autoAdvance) {
                                onSubmit(newAnswers);
                            }
                        }} />
                );
            case "number_input":
                return (
                    <NumberInput
                        key={field.id}
                        label={t(field.label)}
                        value={answers[field.id] ?? field.default ?? 0}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        onChange={(val) => setAnswers((prev) => ({ ...prev, [field.id]: val }))}
                        onSave={(val) => {
                            const newAnswers = { ...answers, [field.id]: val };
                            setAnswers(newAnswers);
                            onSubmit(newAnswers);
                        }} />
                );
            case "alert":
                return <AlertBlock 
                    key={field.id} 
                    message={t(field.message)} />;
            case "month_picker":
                return (
                    <MonthPicker
                        key={field.id}
                        value={answers[field.id] ?? []}
                        onChange={(val) => setAnswers((prev) => ({ ...prev, [field.id]: val }))}
                        onSave={(val) => {
                            const newAnswers = { ...answers, [field.id]: val };
                            setAnswers(newAnswers);
                            onSubmit(newAnswers);
                        }} />
                );
            case "image_list":
                return (
                    <ImageList
                        key={field.id}
                        images={field.images.map(({ src, label }) => ({
                            src: new URL(`../../assets/img/${src}`, import.meta.url).href,
                            label: label ? t(label) : undefined
                        }))} />
                );
            default:
                return null;
        }
    };

    const iconUrl = node.icon
        ? new URL(`../../assets/icons/${node.icon}`, import.meta.url).href
        : null;

    return (
        <ViewContainer 
            title={t(node.title)}
            subtitle={node.subtitle ? t(node.subtitle) : undefined}
            icon={iconUrl}
            showDate={true}
            onBack={onBack}>
            <Box sx={styles.fieldsBox}>
                {node.fields.map(renderField)}

                {!autoAdvance ? 
                    <Button
                        variant="contained"
                        disabled={!isComplete}
                        onClick={() => onSubmit(answers)}
                        sx={styles.submitButton}>
                        {node.next ? tUI("survey.next") : tUI("survey.finish")}
                    </Button>
                : 
                    <Fragment>
                        <Divider sx={styles.divider} />
                        <Button
                            variant="text"
                            color="inherit"
                            onClick={() => navigate("/app")}
                            sx={styles.backToMenuButton}>
                            {tUI("survey.backToMenu")}
                        </Button>
                    </Fragment>
                }
            </Box>
        </ViewContainer>
    );
};

export default SurveyStep;
