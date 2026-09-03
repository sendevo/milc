import { 
    Typography, 
    Button, 
    Box,
    TextField,
    Grid
} from "@mui/material";
import { useTranslation } from 'react-i18next';
import ViewContainer from "../components/ViewContainer";
import { messageStyle, errorBlockStyle, imageStyle } from "../theme/Error.styles";
import image from "../assets/error_boundary_h.jpeg";


const Error = ({errorMessage, onReset, onReport}) => {

    const { t } = useTranslation();

    const handleReport = () => {
        onReport();
    };

    const handleReset = () => {
        onReset();
    };

    return(
        <ViewContainer 
            title={t("error.title")} 
            onBack={() => navigate("/home")}
            headerSx={{ background: "linear-gradient(to right, #ff0000, #0000ff)" }}
            >
            <Typography sx={messageStyle} mb={2}>
                    {t("error.message1")}
            </Typography>
            <img src={image} style={imageStyle}/>
            <Typography sx={messageStyle}>
                    {t("error.message2")}
            </Typography>
            <Grid 
                container 
                direction={"row"}
                justifyContent={"space-evenly"}
                >
                <Grid item>
                    <Button 
                        onClick={handleReport}
                        variant={"contained"}
                        color={"primary"}>
                            {t("error.sendReport")}
                    </Button>
                </Grid>
                <Grid item>
                    <Button 
                        onClick={handleReset}
                        variant={"contained"}
                        color={"primary"}>
                            {t("error.reset")}
                    </Button>
                </Grid>
            </Grid>
            <Box sx={errorBlockStyle}>
                <TextField
                    label={"Crash dump"}
                    sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#FF0000",
                        },
                    }}
                    value={errorMessage}
                    error
                    multiline
                    rows={15}
                    fullWidth
                    variant={"outlined"}
                    disabled
                    inputProps={{
                        style: {
                            fontFamily: "monospace",
                            fontSize: "13px"
                        }
                    }}
                />
            </Box>
        </ViewContainer>
    );
};

export default Error;