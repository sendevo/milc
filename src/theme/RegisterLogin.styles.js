export const registerLoginStyles = {
    page: {
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        px: 3,
        pt: 8,
        pb: 5,
    },
    submitButton: {
        bgcolor: "#1a5f70",
        "&:hover": { bgcolor: "#154f5e" },
    },
    registerButton: {
        bgcolor: "#1a8898",
        "&:hover": { bgcolor: "#157a88" },
    },
    formCard: {
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    },
    anonymousButton: {
        bgcolor: "#757575",
        "&:hover": { bgcolor: "#616161" },
    },
    buttonContainer: {
        display: "flex",
        width: "100%",
        maxWidth: 380,
        flexDirection: "column",
        gap: 1,
        mt: 5
    },
};
