import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { yesNoFieldStyles as styles } from "../../theme/survey/YesNoField.styles";

/**
 * Renders two Yes/No toggle buttons.
 * Calling onChange(value) updates the answer; the parent decides whether to auto-advance.
 */
const YesNoField = ({ value, onChange }) => {
    const { t } = useTranslation();
    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box sx={styles.buttonGroup}>
                <Button
                    fullWidth
                    variant={value === "yes" ? "contained" : "outlined"}
                    onClick={() => onChange("yes")}>
                    {t("survey.yes")}
                </Button>
                <Button
                    fullWidth
                    variant={value === "no" ? "contained" : "outlined"}
                    onClick={() => onChange("no")}>
                    {t("survey.no")}
                </Button>
            </Box>
        </Box>
    );
};

export default YesNoField;
