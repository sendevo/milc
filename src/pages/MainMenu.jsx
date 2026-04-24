import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import ViewContainer from "../components/ViewContainer";
import MenuCircle from "../components/MenuCircle";
import blueGoat from "../assets/icons/blue_goat.png";
import udder from "../assets/icons/udder.png";
import milkPail from "../assets/icons/milk_pail.png";
import goatHealth from "../assets/icons/goat_health.png";
import weed from "../assets/icons/weed.png";
import cattlePen from "../assets/icons/cattle_pen.png";
import barn from "../assets/icons/barn.png";
import pest from "../assets/icons/pest.png";
import sheet from "../assets/icons/sheet.png";

const ButtonsContainer = ({ children }) => (
  <Box
    sx={{
      border: "1.5px solid #d0d0d0",
      borderRadius: 3,
      boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
      p: 2.5,
    }}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gap={2}
        justifyItems="center"
      >
      {children}
      </Box>
  </Box>
);

const MainMenu = () => {
  const { t } = useTranslation();

  const myDayItems = [
    { icon: blueGoat, label: t("mainMenu.beforeMilking") },
    { icon: udder, label: t("mainMenu.duringMilking") },
    { icon: milkPail, label: t("mainMenu.milkCare") },
  ];

  const moreActionItems = [
    { icon: goatHealth, label: t("mainMenu.health") },
    { icon: weed, label: t("mainMenu.food") },
    { icon: cattlePen, label: t("mainMenu.facilities") },
    { icon: barn, label: t("mainMenu.mySupplies") },
    { icon: pest, label: t("mainMenu.pests") },
    { icon: sheet, label: t("mainMenu.myRecords") },
  ];

  return (
    <ViewContainer title={t("mainMenu.panelTitle")}>

      <Box px={2} display="flex" flexDirection="column" gap={3}>
        {/* MI DÍA section */}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            textAlign="center"
            textTransform="uppercase"
            sx={{ color: "#1a8090", mb: 1.5, mt: 2}}
          >
            {t("mainMenu.myDay")}
          </Typography>
          <ButtonsContainer>
              {myDayItems.map((item) => (
                <MenuCircle
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  borderColor="#1a8090"
                />
              ))}
          </ButtonsContainer>
        </Box>

        {/* MÁS ACCIONES section */}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            textAlign="center"
            textTransform="uppercase"
            sx={{ color: "#1a8090", mb: 1.5 }}
          >
            {t("mainMenu.moreActions")}
          </Typography>
          <ButtonsContainer>
              {moreActionItems.map((item) => (
                <MenuCircle
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  borderColor="#757575"
                />
              ))}
          </ButtonsContainer>
        </Box>
      </Box>
    </ViewContainer>
  );
};

export default MainMenu;
