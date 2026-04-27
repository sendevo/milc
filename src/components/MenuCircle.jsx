import { Box, Typography } from "@mui/material";
import { menuCircleStyles as styles } from "../theme/MenuCircle.styles";

const MenuCircle = ({ icon, label, borderColor, onClick }) => (
    <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={0.75}
        onClick={onClick}
        sx={styles.wrapper(Boolean(onClick))}>
        <Box sx={styles.circle(borderColor)}>
            <img src={icon} alt={label} style={styles.icon} />
        </Box>
        <Typography
            variant="caption"
            textAlign="center"
            sx={styles.label}>
            {label}
        </Typography>
    </Box>
);

export default MenuCircle;
