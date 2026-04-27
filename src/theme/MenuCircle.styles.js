export const menuCircleStyles = {
    wrapper: (hasOnClick) => ({
        cursor: hasOnClick ? "pointer" : "default",
    }),
    circle: (borderColor) => ({
        width: 72,
        height: 72,
        borderRadius: "50%",
        border: `2.5px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }),
    label: {
        maxWidth: 76,
        lineHeight: 1.3,
        fontSize: 12,
        color: "#444",
    },
    icon: {
        width: 40,
        height: 40,
        objectFit: "contain",
    },
};
