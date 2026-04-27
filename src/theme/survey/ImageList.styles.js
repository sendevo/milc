export const imageListStyles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        py: 1,
    },
    item: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
    },
    image: {
        width: "80%",
        objectFit: "contain",
        boxShadow: "1px 1px 5px gray",
        borderRadius: 40,
    },
    caption: {
        textAlign: "center",
        color: "text.secondary",
        fontSize: "0.9rem",
    },
};
