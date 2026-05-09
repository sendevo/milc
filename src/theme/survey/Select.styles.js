export const SelectStyles = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    button: {
        bgcolor: "background.paper",
        color: "text.primary",
        borderColor: "divider",
        padding: "5px",
        "&:hover": {
            bgcolor: "action.hover",
            borderColor: "primary.main",
        },
    }
};