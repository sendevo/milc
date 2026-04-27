import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { viewContainerStyles as styles } from "../theme/ViewContainer.styles";


const ViewContainer = ({ title, onBack, children }) => {
    return (
        <Box
            sx={styles.container}>
            <Box
                sx={styles.header}>
                {onBack && (
                    <IconButton
                        onClick={onBack}
                        sx={styles.backButton}>
                        <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                )}
                <Typography
                    variant="h6"
                    sx={styles.title}>
                    {title}
                </Typography>
            </Box>
            <Box sx={styles.content}>
                {children}
            </Box>
        </Box>
    );
};

export default ViewContainer;
