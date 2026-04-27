import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Renders two Yes/No toggle buttons.
 * Calling onChange(value) updates the answer; the parent decides whether to auto-advance.
 */
const YesNoField = ({ label, value, onChange }) => {
    const { t } = useTranslation();
    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {label && (
                <Typography
                    variant="body1"
                    fontWeight={500}
                    color="text.primary">
                    {label}
                </Typography>
            )}
            <Box display="flex" gap={2}>
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
