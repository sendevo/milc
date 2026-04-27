import moment from "moment";
import { Typography, Box } from "@mui/material";
import { dateTimeStyles as styles } from "../theme/DateTime.styles";

const DateTime = ({ date }) => {
    const formattedDate = moment(date).format("DD/mm/yyyy");
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