import { Box, Typography } from "@mui/material";
import { textBlockStyles as styles } from "../../theme/survey/TextBlock.styles";
import { sanitizeLimitedHtml } from "../../utils/sanitizeLimitedHtml";

const TextBlock = ({ message }) => (
    <Box sx={styles.container}>
        <Typography sx={styles.text}>
            <span dangerouslySetInnerHTML={{ __html: sanitizeLimitedHtml(message) }} />
        </Typography>
    </Box>
);

export default TextBlock;