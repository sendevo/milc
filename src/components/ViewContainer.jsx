import { Box, Typography } from "@mui/material";

const ViewContainer = ({title, onBack, children}) => {
  return (
    <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            bgcolor: "#ffffff"
        }}>
      <Box
        sx={{
            width: "100%",
            background: "linear-gradient(90deg, #1a8090 0%, #2dc5a2 100%)",
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            py: 4,
            px: 3,
            textAlign: "center",
        }}>
            <Typography
                variant="h6"
                fontWeight="bold"
                color="#ffffff"
                textTransform="uppercase">
                {title}
            </Typography>
        </Box>
        <Box 
            sx={{
                px: 2,
                display: "flex",
                flexDirection: "column",
                gap: 3,
                flexGrow: 1
            }}>
            {children}
        </Box>
    </Box>
  );
};

export default ViewContainer;
