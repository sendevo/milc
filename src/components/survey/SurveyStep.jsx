import { useState } from "react";
import { Box, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ViewContainer from "../ViewContainer";
import YesNoField from "./YesNoField";
import SelectField from "./SelectField";
import AlertBlock from "./AlertBlock";
import { t } from "../../survey/tree";

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
const SurveyStep = ({ node, onSubmit, onBack }) => {
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  const inputFields = node.fields.filter((f) => f.type !== "alert");
  const autoAdvance =
    inputFields.length === 1 && inputFields[0].type === "yes_no";

  const setAnswer = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleYesNoChange = (fieldId, value) => {
    const next = { ...answers, [fieldId]: value };
    setAnswers(next);
    if (autoAdvance) onSubmit(next);
  };

  const isComplete = inputFields.every((f) => answers[f.id] !== undefined);

  const renderField = (field) => {
    switch (field.type) {
      case "yes_no":
        return (
          <YesNoField
            key={field.id}
            label={t(field.label)}
            value={answers[field.id]}
            onChange={(val) => handleYesNoChange(field.id, val)}
          />
        );
      case "select":
        return (
          <SelectField
            key={field.id}
            label={t(field.label)}
            value={answers[field.id]}
            onChange={(val) => setAnswer(field.id, val)}
            options={field.options.map((o) => ({ ...o, label: t(o.label) }))}
          />
        );
      case "alert":
        return <AlertBlock key={field.id} severity={field.severity} message={t(field.message)} />;
      default:
        return null;
    }
  };

  return (
    <ViewContainer title={t(node.title)} onBack={onBack}>
      <Box display="flex" flexDirection="column" gap={2} mt={2}>
        {node.fields.map(renderField)}

        {!autoAdvance && (
          <Button
            variant="contained"
            disabled={!isComplete}
            onClick={() => onSubmit(answers)}
            sx={{ mt: 1 }}
          >
            {node.next ? "Siguiente" : "Finalizar"}
          </Button>
        )}

        <Divider sx={{ mt: 1 }} />
        <Button
          variant="text"
          color="inherit"
          onClick={() => navigate("/app")}
          sx={{ color: "text.secondary", fontSize: "0.8rem" }}
        >
          Volver al menú principal
        </Button>
      </Box>
    </ViewContainer>
  );
};

export default SurveyStep;
