import { Box, Typography } from "@mui/material";
import { alertBlockStyles as styles } from "../../theme/survey/AlertBlock.styles";
import warningIcon from "../../assets/icons/warning.png";
import infoIcon from "../../assets/icons/ok_done.png";
import { sanitizeLimitedHtml } from "../../utils/sanitizeLimitedHtml";

const getAlertIcon = (severity) => {
    switch (severity) {
        case "info":
            return {
                src: infoIcon,
                alt: "Info",
            };
        case "warning":
            return {
                src: warningIcon,
                alt: "Warning",
            };
        default:
            return {
                src: warningIcon,
                alt: "Warning",
            };
    }
};

/** Informational / warning / error block. No user input. */
const AlertBlock = ({ message, severity = "warning" }) => {
    const icon = getAlertIcon(severity);

    return (
        <Box>
            <Box sx={styles.iconContainer}>
                <img src={icon.src} alt={icon.alt} style={styles.icon} />
            </Box>
            <Box sx={styles.container}>
                <Typography sx={styles.text}>
                    <span dangerouslySetInnerHTML={{ __html: sanitizeLimitedHtml(message) }} />
                </Typography>
            </Box>
        </Box>
    );
};

export default AlertBlock;
