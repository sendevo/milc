import { Box, Typography } from "@mui/material";
import { imageListStyles as styles } from "../../theme/survey/ImageList.styles";

/**
 * Displays a vertical column of images, each with an optional caption.
 *
 * Props:
 *   images — Array<{ src: string, label?: string }>
 *            src   — resolved URL (use import.meta.url in the caller)
 *            label — optional caption text (already translated)
 */
const ImageList = ({ images = [] }) => (
    <Box sx={styles.container}>
        {images.map(({ src, label }, index) => (
            <Box
                key={index}
                sx={styles.item}>
                <img
                    src={src}
                    alt={label ?? ""}
                    style={styles.image} />
                {label && (
                    <Typography sx={styles.caption}>
                        {label}
                    </Typography>
                )}
            </Box>
        ))}
    </Box>
);

export default ImageList;
