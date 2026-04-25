import { Alert } from "@mui/material";

/** Informational / warning / error block. No user input. */
const AlertBlock = ({ severity, message }) => (
  <Alert severity={severity ?? "info"}>{message}</Alert>
);

export default AlertBlock;
