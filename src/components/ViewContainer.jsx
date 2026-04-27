import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DateTime from "../components/DateTime";
import { viewContainerStyles as styles } from "../theme/ViewContainer.styles";


const ViewContainer = ({ title, subtitle, showDate, icon, onBack, children }) => {
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
            { showDate && <DateTime sx={styles.date} /> }
            { subtitle && 
                <Box sx={styles.subtitleContainer}>
                    <Typography
                        sx={styles.subtitleText}>
                        {subtitle}
                    </Typography>
                </Box>
            }
            { icon &&
                <Box sx={styles.iconContainer}>
                    <img src={icon} alt="Icon" style={styles.icon} />
                </Box>
            }
            <Box sx={styles.content}>
                {children}
            </Box>
        </Box>
    );
};

export default ViewContainer;
