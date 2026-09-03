import { useState, useRef, useEffect } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { numberInputStyles as styles } from "../../theme/survey/NumberInput.styles";
import {
    sanitizeTypedValue,
    parseNumericValue,
    parseNonNegativeNumber,
    formatNumericValue
} from "../../utils";

/**
 * Numeric input field with increment/decrement controls and a Save button.
 * Uses locale-aware formatting: "." groups thousands, "," is the decimal separator,
 * matching the framework7 Input component's typing/formatting behavior.
 *
 * Props:
 *   value    — number  current value (controlled)
 *   onChange — (value: number) => void  called with the parsed numeric value on every change
 *   onSave   — (value: number) => void  called when Save is tapped
 *   min      — number  minimum allowed value (default: 0)
 *   max      — number  maximum allowed value (default: Infinity)
 *   step     — number  increment/decrement step (default: 1)
 */

const NumberInput = ({ value = 0, onChange, onSave, min = 0, max = Infinity, step = 1 }) => {
    const { t } = useTranslation();
 
    const [text, setText] = useState(() => formatNumericValue(value));
    const isFocused = useRef(false);
 
    const clamp = (v) => Math.min(max, Math.max(min, v));
 
    // Sync from props.value, but don't fight the user mid-keystroke.
    useEffect(() => {
        if (isFocused.current) return;
        setText(formatNumericValue(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
 
    const commit = (numericValue) => {
        const clamped = clamp(numericValue);
        onChange?.(clamped);
        return clamped;
    };
 
    const handleTextChange = (e) => {
        const originalValue = e?.target?.value ?? "";
 
        // A single "." typed as a keystroke (e.g. from an en-locale numeric
        // keypad) means the user wants a decimal separator, not grouping —
        // grouping dots are only ever inserted programmatically, never typed.
        // Pasted text ("1.000,03") is left untouched, since there dots really
        // do mean thousands-grouping.
        const isSingleTypedDot =
            e?.nativeEvent?.inputType === "insertText" && e?.nativeEvent?.data === ".";
 
        const valueForSanitizing = isSingleTypedDot
            ? originalValue.replace(/\.(?!.*\.)/, ",") // swap the just-typed dot for a comma
            : originalValue;
 
        const sanitizedText = sanitizeTypedValue(valueForSanitizing);
        setText(sanitizedText);
 
        const parsedNumber = parseNumericValue(sanitizedText);
        if (parsedNumber !== "") commit(parsedNumber);
    };
 
    const handleFocus = () => {
        isFocused.current = true;
    };
 
    const handleBlur = () => {
        const parsed = parseNumericValue(text);
        const clamped = commit(parsed === "" ? min : parsed);
        setText(formatNumericValue(clamped));
        isFocused.current = false;
    };
 
    const step_ = (delta) => {
        const current = parseNumericValue(text);
        const base = current === "" ? 0 : current;
        const clamped = commit(base + delta);
        setText(formatNumericValue(clamped));
    };
 
    const currentNumeric = parseNumericValue(text);
 
    return (
        <Box sx={styles.container}>
            <Box sx={styles.controls}>
                <Button
                    variant="outlined"
                    onClick={() => step_(-step)}
                    disabled={currentNumeric !== "" && currentNumeric <= min}
                    sx={styles.decrementButton}>
                    −
                </Button>
 
                <TextField
                    type="text"
                    inputMode="decimal"
                    value={text}
                    onChange={handleTextChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    inputProps={{ style: { textAlign: "center", fontSize: "1.2rem" } }}
                    fullWidth />
 
                <Button
                    variant="outlined"
                    onClick={() => step_(step)}
                    disabled={currentNumeric !== "" && currentNumeric >= max}
                    sx={styles.incrementButton}>
                    +
                </Button>
            </Box>
 
            <Button
                variant="contained"
                fullWidth
                onClick={() => {
                    const parsed = parseNumericValue(text);
                    onSave?.(clamp(parsed === "" ? min : parsed));
                }}
                sx={styles.saveButton}>
                {t("survey.save")}
            </Button>
        </Box>
    );
};
 
export default NumberInput;
 