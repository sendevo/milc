import { Box } from "@mui/material";

const GradientHeader = ({ children, py = 4 }) => (
  <Box
    sx={{
      width: "100%",
      background: "linear-gradient(90deg, #1a8090 0%, #2dc5a2 100%)",
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      py,
      px: 3,
      textAlign: "center",
    }}
  >
    {children}
  </Box>
);

export default GradientHeader;
