import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import ViewContainer from "../components/ViewContainer";

const ResultScales = () => {
    const navigate = useNavigate();

    return (
        <ViewContainer
            title="Result Scales"
            onBack={() => navigate("/milkbarchart")}
            showDate>
            <Box />
        </ViewContainer>
    );
};

export default ResultScales;
