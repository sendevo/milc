import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: "#1a8898",
            dark: "#1a5f70",
            light: "#2dc5a2",
            contrastText: "#ffffff",
        },
        background: {
            default: "#ffffff",
            paper: "#ffffff",
        },
    },
    typography: {
        fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 28,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    paddingTop: 13,
                    paddingBottom: 13,
                    fontSize: "1rem",
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: "outlined",
            },
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        backgroundColor: "#ffffff",
                        borderRadius: 4,
                    },
                },
            },
        },
    },
});

export default theme;
