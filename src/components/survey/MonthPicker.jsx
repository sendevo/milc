import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { monthPickerStyles as styles } from "../../theme/survey/MonthPicker.styles";

const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

/**
 * Multi-select month picker displayed as a 4×3 grid of toggle buttons.
 *
 * Props:
 *   value    — number[]  selected month indices (1–12, controlled)
 *   onChange — (months: number[]) => void  called on every toggle
 *   onSave   — (months: number[]) => void  called when Save is tapped
 */
const MonthPicker = ({ value = [], onChange, onSave }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState(value);

    const toggle = (month) => {
        const next = selected.includes(month)
            ? selected.filter((m) => m !== month)
            : [...selected, month];
        setSelected(next);
        onChange?.(next);
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.grid}>
                {MONTH_KEYS.map((key, index) => {
                    const month = index + 1;
                    const active = selected.includes(month);
                    return (
                        <Button
                            key={key}
                            variant={active ? "contained" : "outlined"}
                            onClick={() => toggle(month)}
                            sx={active ? styles.buttonActive : styles.button}>
                            {t(`survey.months.${key}`)}
                        </Button>
                    );
                })}
            </Box>

            <Button
                variant="contained"
                fullWidth
                disabled={selected.length === 0}
                onClick={() => onSave?.(selected)}
                sx={styles.saveButton}>
                {t("survey.save")}
            </Button>
        </Box>
    );
};

export default MonthPicker;
