import { Alert, Box, Typography } from "@mui/material";
import { formCardStyles as styles } from "../theme/FormCard.styles";

const FormCard = ({ id, onSubmit, title, error, children }) => (
    <Box
        id={id}
        component="form"
        onSubmit={onSubmit}
        sx={styles.box}>
        <Typography
            variant="h6"
            textAlign="center"
            fontWeight="bold"
            textTransform="uppercase"
            sx={styles.title}>
            {title}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {children}
    </Box>
);

export default FormCard;
