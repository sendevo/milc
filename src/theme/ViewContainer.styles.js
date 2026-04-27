export const viewContainerStyles = {
    container: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#ffffff",
    },
    header: {
        width: "100%",
        background: "linear-gradient(90deg, #1a8090 0%, #2dc5a2 100%)",
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        py: 4,
        px: 3,
        position: "relative",
        textAlign: "center",
    },
    title: {
        fontWeight: "bold",
        color: "#ffffff",
        textTransform: "uppercase",
    },
    backButton: {
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        color: "#ffffff",
    },
    content: {
        px: 2,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        flexGrow: 1,
    },
};
