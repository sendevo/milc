export const captchaDialogStyles = {
    dialog: {
        "& .MuiDialog-paper": {
            borderRadius: 4,
            px: 1,
            py: 1,
        },
    },
    title: {
        fontWeight: "bold",
        textAlign: "center",
        color: "#1a5f70",
    },
    content: {
        display: "flex",
        justifyContent: "center",
        pb: 1,
    },
    actions: {
        px: 3,
        pb: 2,
        gap: 1,
    },
    confirmButton: {
        bgcolor: "#757575",
        "&:hover": { bgcolor: "#616161" },
        flex: 1,
    },
    cancelButton: {
        flex: 1,
    },
};
