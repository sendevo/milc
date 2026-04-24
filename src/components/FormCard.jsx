import { Alert, Box, Typography } from "@mui/material";

const FormCard = ({ id, onSubmit, title, error, children }) => (
  <Box
    id={id}
    component="form"
    onSubmit={onSubmit}
    sx={{
      bgcolor: "#e0e0e0",
      borderRadius: 4,
      px: 4,
      py: 4,
      width: "100%",
      maxWidth: 380,
      display: "flex",
      flexDirection: "column",
      gap: 2.5,
    }}
  >
    <Typography
      variant="h6"
      textAlign="center"
      fontWeight="bold"
      textTransform="uppercase"
      sx={{ color: "#5a5a5a", mb: 1 }}
    >
      {title}
    </Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {children}
  </Box>
);

export default FormCard;
