import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

/**
 * Controlled select dropdown.
 * options: [{ value: string, label: string }]
 */
const SelectField = ({ label, value, onChange, options }) => (
  <FormControl fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select
      value={value ?? ""}
      label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default SelectField;
