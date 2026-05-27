import { Box } from "@mui/material";
import { audioListStyles as styles } from "../../theme/survey/AudioList.styles";

/**
 * Displays a vertical list of audio players.
 *
 * Props:
 *   audios - Array<{ src: string }>
 *            src - resolved URL (use import.meta.url in the caller)
 */
const AudioList = ({ audios = [] }) => (
    <Box sx={styles.container}>
        {audios.map(({ src }, index) => (
            <Box
                key={index}
                sx={styles.item}>
                <audio
                    controls
                    preload="metadata"
                    src={src}
                    style={styles.audio} />
            </Box>
        ))}
    </Box>
);

export default AudioList;
