import { Box, Typography } from "@mui/material";
import { alertBlockStyles as styles } from "../../theme/survey/AlertBlock.styles";
import warningIcon from "../../assets/icons/warning.png"
import { sanitizeLimitedHtml } from "../../utils/sanitizeLimitedHtml";


/** Informational / warning / error block. No user input. */
const AlertBlock = ({ message }) => (
    <Box>
        <Box sx={styles.iconContainer}>
            <img src={warningIcon} alt="Warning" style={styles.icon} />
        </Box>
        <Box sx={styles.container}>    
            <Typography sx={styles.text}>
                <span dangerouslySetInnerHTML={{ __html: sanitizeLimitedHtml(message) }} />
            </Typography>
        </Box>
    </Box>
);

export default AlertBlock;
