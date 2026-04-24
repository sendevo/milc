import { Box, Typography } from "@mui/material";

const MenuCircle = ({ icon, label, borderColor }) => (
  <Box display="flex" flexDirection="column" alignItems="center" gap={0.75}>
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        border: `2.5px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img src={icon} alt={label} style={{ width: 40, height: 40, objectFit: "contain" }} />
    </Box>
    <Typography
      variant="caption"
      textAlign="center"
      sx={{ maxWidth: 76, lineHeight: 1.3, fontSize: 12, color: "#444" }}
    >
      {label}
    </Typography>
  </Box>
);

export default MenuCircle;
