import moment from "moment";
import { Typography, Box } from "@mui/material";
import { dateTimeStyles as styles } from "../theme/DateTime.styles";
import { useSettings } from "../contexts/SettingsContext";

const DateTime = ({ date }) => {
    const { getCurrentDateTime } = useSettings();
    const effectiveDate = date || getCurrentDateTime();
    const formattedDate = moment(effectiveDate).format("DD/MM/YYYY");
    return (
        <Box sx={styles.container}>
            <Typography 
                variant="body2" 
                sx={styles.text}>
                {formattedDate}
            </Typography>
        </Box>
    );
};

export default DateTime;