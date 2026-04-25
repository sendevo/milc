import { useState } from "react";
import { Box, Button } from "@mui/material";
import ViewContainer from "../ViewContainer";
import YesNoField from "./YesNoField";
import SelectField from "./SelectField";
import AlertBlock from "./AlertBlock";

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
            label={field.label}
            value={answers[field.id]}
            onChange={(val) => handleYesNoChange(field.id, val)}
          />
        );
      case "select":
        return (
          <SelectField
            key={field.id}
            label={field.label}
            value={answers[field.id]}
            onChange={(val) => setAnswer(field.id, val)}
            options={field.options}
          />
        );
      case "alert":
        return <AlertBlock key={field.id} severity={field.severity} message={field.message} />;
      default:
        return null;
    }
  };

  return (
    <ViewContainer title={node.title} onBack={onBack}>
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
      </Box>
    </ViewContainer>
  );
};

export default SurveyStep;
