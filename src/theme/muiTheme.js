import { createTheme } from "@mui/material";

const createAppTheme = (mode = "light") => createTheme({
    palette: {
        mode,
        primary: {
            main: "#1a8898",
            dark: "#1a5f70",
            light: "#2dc5a2",
            contrastText: "#ffffff",
        },
        background: {
            default: mode === "dark" ? "#121212" : "#ffffff",
            paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
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
                root: ({ theme }) => ({
                    "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 4,
                    },
                }),
            },
        },
    },
});

export default createAppTheme;
