export const surveyStepStyles = {
    fieldsBox: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 2,
        flex: 1,
        pb: 2,
    },
    bottomArea: {
        mt: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        position: "sticky",
        bottom: 0,
        zIndex: 2,
        pt: 1,
        pb: "max(8px, env(safe-area-inset-bottom))",
        backgroundColor: "background.default",
    },
    submitButton: {
        mt: 1,
        mb: 2
    },
    divider: {
        mt: 1,
    },
    backToMenuButton: {
        color: "text.secondary",
        fontSize: "0.8rem",
        border: "1px solid",
        borderColor: "text.secondary",
        mt: 1,
    }
};
