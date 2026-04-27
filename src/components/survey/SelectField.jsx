import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

/**
 * Controlled select dropdown.
 * options: [{ value: string, label: string }]
 */
const SelectField = ({ label, value, onChange, options }) => (
    <FormControl fullWidth>
        <Select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

export default SelectField;
