import { Box, Button, Typography } from "@mui/material";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ViewContainer from "../components/ViewContainer";
import AudioList from "../components/survey/AudioList";
import { useSettings } from "../contexts/SettingsContext";
import { surveyStepStyles as styles } from "../theme/SurveyStep.styles";

const containerStyles = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: 2,
    mt: 2,
    pb: 2,
};

const dateBoxStyles = {
    border: "2px solid",
    borderColor: "grey.500",
    borderRadius: 2,
    p: 2,
    textAlign: "center",
};

const buttonStyles = {
    ...styles.submitButton,
};

const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const LABELING_AUDIOS = [
    { src: new URL("../assets/audio/AUDIO8.mp3", import.meta.url).href },
];

const View223 = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Opened from a result screen: go back there instead of to the question
    const resultsDepth = Number(location.state?.resultsDepth) || 0;
    const handleBack = () => {
        if (resultsDepth > 0) {
            navigate(-resultsDepth);
            return;
        }
        navigate("/survey/view-130");
    };
    const { i18n } = useTranslation();
    const { getCurrentDateTime } = useSettings();

    const isSpanish = i18n.language?.toLowerCase().startsWith("es");
    const labels = useMemo(() => {
        if (isSpanish) {
            return {
                title: "Acondicionar la leche",
                subtitle: "Rotular el envase",
                milkingDate: "Fecha de ordeño",
                back: "Atrás",
            };
        }

        return {
            title: "Milk conditioning",
            subtitle: "Label the container",
            milkingDate: "Milking date",
            back: "Back",
        };
    }, [isSpanish]);

    const today = formatDateDDMMYYYY(getCurrentDateTime());

    return (
        <ViewContainer
            title={labels.title}
            subtitle={labels.subtitle}
            showDate={true}>
            <Box sx={containerStyles}>
                <AudioList audios={LABELING_AUDIOS} />

                <Box sx={dateBoxStyles}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {labels.milkingDate}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                        {today}
                    </Typography>
                </Box>

                <Box sx={styles.bottomArea}>
                    <Button
                        variant="contained"
                        onClick={handleBack}
                        sx={buttonStyles}>
                        {labels.back}
                    </Button>
                </Box>
            </Box>
        </ViewContainer>
    );
};

export default View223;