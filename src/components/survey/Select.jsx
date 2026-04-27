import { 
    Box,
    Button
} from "@mui/material";
import { SelectStyles as styles } from "../../theme/survey/Select.styles";

/**
 * Controlled select dropdown.
 * options: [{ options: array }]
 */
const Select = ({ options, onSelect }) => (
    <Box sx={styles.container}>
        {options.map((option) => (
            <Button
                key={option.value}
                fullWidth
                variant="outlined"
                sx={styles.button}
                onClick={() => onSelect(option.value)}>
                {option.label}
            </Button>
        ))}
    </Box> 
);

export default Select;
