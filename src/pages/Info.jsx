import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography,
    Grid
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ViewContainer from "../components/ViewContainer";
import { infoStyles as styles } from "../theme/Info.styles";
import logoInta from '../assets/logo_inta.png';

const Info = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <ViewContainer
            title={t("info.title")}
            onBack={() => navigate("/app")}>
            <Grid container direction="column" sx={{mt: 1}}>
                <Grid item>
                    <Accordion sx={styles.accordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={styles.accordionSummary}>{t('info.version')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <h3 style={{margin:0, textAlign:"center"}}>MILC 1.0.0</h3>
                            <h3 style={{margin:0}}>Staff</h3>
                            <Typography><b>{t('info.author')}:</b> Edurne Battista, Mariano Zetola,....</Typography>
                            <Typography><b>{t('info.developer')}:</b> <a href="https://sendevosoftware.com.ar" target="_blank" rel="noopener noreferrer">Sendevo Software</a></Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={styles.accordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={styles.accordionSummary}>{t('info.description')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography style={{textAlign: "justify"}}>{t('info.descriptionP1')}</Typography>
                            <Typography style={{textAlign: "justify"}}>{t('info.descriptionP2')}</Typography>
                            <Typography style={{textAlign: "justify"}}>{t('info.descriptionP3')}</Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={styles.accordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={styles.accordionSummary}>{t('info.contact')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography sx={{mt:1, mb:1}}>
                                <img src={logoInta} width="25px" style={{verticalAlign:"middle"}} alt="logo INTA"/> INTA <a href="https://inta.gob.ar" target="_blank">inta.gob.ar</a>
                            </Typography>
                            <Typography sx={{mt:1, mb:1}}>
                                <img src={logoInta} width="25px" style={{verticalAlign:"middle"}} alt="logo INTA"/> Instituto de Investigación y Desarrollo Tecnológico para la Agricultura Familiar Región Pampeana (IPAF Región Pampeana)
                            </Typography>
                            <Typography sx={{mt:1, mb:1}}>
                                E-mail: <a href="mailto:cipaf@inta.gob.ar">cipaf@inta.gob.ar</a>
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={styles.accordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={styles.accordionSummary}>{t('info.sources')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>          
                            <Typography style={{textAlign:"justify"}}>{t('info.sourcesText')}</Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={styles.accordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={styles.accordionSummary}>{t('info.terms')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography><i>{t('info.termsAccept')}</i></Typography>
                            <Typography style={{textAlign:"justify"}}>{t('info.termsP1')}</Typography>
                            <Typography style={{textAlign:"justify"}}>{t('info.termsP2')}</Typography>
                            <ul style={{listStyle: "inside", paddingLeft: "10px", textAlign: "justify"}}>
                                <li>{t('info.termsIt1')}</li>
                                <li>{t('info.termsIt2')}</li>
                                <li>{t('info.termsIt3')}</li>
                            </ul>
                            <Typography><i>{t('info.termsChanges')}</i></Typography>
                            <Typography style={{textAlign:"justify"}}>{t('info.termsChangesP1')}</Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={styles.accordion}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={styles.accordionSummary}>{t('info.responsibilities')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography style={{textAlign:"justify"}}>{t('info.responsibilitiesP1')}</Typography>
                        </AccordionDetails>
                    </Accordion>
                </Grid>
            </Grid>
        </ViewContainer>
    );
};

export default Info;
