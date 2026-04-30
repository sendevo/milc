import { Box, Button } from "@mui/material";
import { BottomNavigationStyles as styles } from "../../theme/survey/BottomNavigation.styles";

/**
 * BottomNavigation — two side-by-side buttons that navigate to configurable nodes.
 *
 * Props:
 *   buttons    — [{ label: string, target: string }]  exactly two items expected
 *   onNavigate — (targetNodeId: string) => void
 */
const BottomNavigation = ({ buttons, onNavigate }) => (
    <Box sx={styles.container}>
        {buttons.map((btn, i) => (
            <Button
                key={i}
                variant="contained"
                sx={styles.button}
                onClick={() => onNavigate(btn.target)}>
                {btn.label}
            </Button>
        ))}
    </Box>
);

export default BottomNavigation;
