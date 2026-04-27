import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { numberInputStyles as styles } from "../../theme/survey/NumberInput.styles";

/**
 * Numeric input field with increment/decrement controls and a Save button.
 *
 * Props:
 *   value    — number  current value (controlled)
 *   onChange — (value: number) => void  called on every change
 *   onSave   — (value: number) => void  called when Save is tapped
 *   min      — number  minimum allowed value (default: 0)
 *   max      — number  maximum allowed value (default: Infinity)
 *   step     — number  increment/decrement step (default: 1)
 */
const NumberInput = ({ value = 0, onChange, onSave, min = 0, max = Infinity, step = 1 }) => {
    const { t } = useTranslation();
    const [internal, setInternal] = useState(value);

    const clamp = (v) => Math.min(max, Math.max(min, v));

    const update = (v) => {
        const clamped = clamp(v);
        setInternal(clamped);
        onChange?.(clamped);
    };

    const handleTextChange = (e) => {
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) update(parsed);
        else setInternal(e.target.value);
    };

    const handleBlur = () => {
        const parsed = parseFloat(internal);
        update(isNaN(parsed) ? min : parsed);
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.controls}>
                <Button
                    variant="outlined"
                    onClick={() => update(clamp(internal - step))}
                    disabled={internal <= min}
                    sx={styles.decrementButton}>
                    −
                </Button>

                <TextField
                    type="number"
                    value={internal}
                    onChange={handleTextChange}
                    onBlur={handleBlur}
                    inputProps={{ min, max, step, style: { textAlign: "center", fontSize: "1.2rem" } }}
                    fullWidth />

                <Button
                    variant="outlined"
                    onClick={() => update(clamp(internal + step))}
                    disabled={internal >= max}
                    sx={styles.incrementButton}>
                    +
                </Button>
            </Box>

            <Button
                variant="contained"
                fullWidth
                onClick={() => onSave?.(clamp(parseFloat(internal) || min))}
                sx={styles.saveButton}>
                {t("survey.save")}
            </Button>
        </Box>
    );
};

export default NumberInput;
