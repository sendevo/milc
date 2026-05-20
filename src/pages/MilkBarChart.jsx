import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";

const MilkBarChart = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    return (
        <ViewContainer
            title="Milk Bar Chart"
            onBack={() => navigate("/calendar")}
            showDate>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    alignItems: "center",
                    pt: 2,
                }}>
                <Typography variant="body1">fromDate: {fromDate}</Typography>
                <Typography variant="body1">toDate: {toDate}</Typography>
                <Button variant="outlined" onClick={() => navigate("/calendar")}>Volver</Button>
            </Box>
        </ViewContainer>
    );
};

export default MilkBarChart;
