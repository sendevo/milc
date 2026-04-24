import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import GradientHeader from "../components/GradientHeader";
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
    <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="#ffffff">
      <GradientHeader py={4}>
        <Typography
          variant="h6"
          fontWeight={800}
          color="#ffffff"
          letterSpacing={2}
          textTransform="uppercase"
        >
          {t("mainMenu.panelTitle")}
        </Typography>
      </GradientHeader>

      <Box px={2} display="flex" flexDirection="column" gap={3}>
        {/* MI DÍA section */}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            textAlign="center"
            letterSpacing={1}
            textTransform="uppercase"
            sx={{ color: "#1a8090", mb: 1.5 }}
          >
            {t("mainMenu.myDay")}
          </Typography>
          <Box
            sx={{
              border: "1.5px solid #d0d0d0",
              borderRadius: 3,
              p: 2.5,
            }}
          >
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={2}
              justifyItems="center"
            >
              {myDayItems.map((item) => (
                <MenuCircle
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  borderColor="#1a8090"
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* MÁS ACCIONES section */}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={800}
            textAlign="center"
            letterSpacing={1}
            textTransform="uppercase"
            sx={{ color: "#1a8090", mb: 1.5 }}
          >
            {t("mainMenu.moreActions")}
          </Typography>
          <Box
            sx={{
              border: "1.5px solid #d0d0d0",
              borderRadius: 3,
              p: 2.5,
            }}
          >
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={2.5}
              justifyItems="center"
            >
              {moreActionItems.map((item) => (
                <MenuCircle
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  borderColor="#757575"
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainMenu;
