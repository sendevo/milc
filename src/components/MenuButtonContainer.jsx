import { Box } from "@mui/material";
import { buttonsContainerStyles } from "../theme/ButtonsContainer.styles";

const ButtonsContainer = ({ children }) => (
    <Box sx={buttonsContainerStyles}>
        <Box
            display="flex"
            flexWrap="wrap"
            justifyContent="space-around"
            columnGap={2}
            rowGap={2}>
            {children}
        </Box>
    </Box>
);

export default ButtonsContainer;