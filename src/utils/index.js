export const sanitizeTypedValue = raw => {
    // Sanitizes text as-you-type, preserving intermediate states like
    // "0," or "1.000,0" instead of collapsing them.

    if (raw === '') return '';

    let cleaned = raw.replace(/[^\d.,]/g, '');

    const firstComma = cleaned.indexOf(',');
    if (firstComma !== -1) {
        cleaned = cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replace(/,/g, '');
    }

    const [intPartRaw, decPartRaw] = cleaned.split(',');
    const intDigits = intPartRaw.replace(/\./g, '').replace(/^0+(?=\d)/, '');
    const groupedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (decPartRaw === undefined) return groupedInt;
    return `${groupedInt || '0'},${decPartRaw}`;
};

export const parseNumericValue = (value) => {
    // "1.234.567,89" -> 1234567.89  ("." = thousands, "," = decimal)
    if (value === '' || value === null || value === undefined) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? value : '';

    const str = String(value).trim();
    if (str === '') return '';

    const [rawInt = '', rawDec = ''] = str.split(',');
    const integerDigits = rawInt.replace(/[^\d]/g, '');
    const decimalDigits = rawDec.replace(/[^\d]/g, '');

    if (integerDigits === '' && decimalDigits === '') return '';

    const normalized = `${integerDigits || '0'}${decimalDigits ? `.${decimalDigits}` : ''}`;
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : '';
};

export const parseNonNegativeNumber = value => {
    const parsed = parseNumericValue(value);
    if (parsed === '') return '';
    return Math.abs(parsed);
};

export const formatNumericValue = value => {
    // 1234.5 -> "1.234,5"  (for display of a *committed* value)

    if (value === '' || value === null || value === undefined) return '';

    const number = typeof value === 'number' ? value : parseNumericValue(value);
    if (number === '' || !Number.isFinite(number)) return '';

    const rounded = Number(number.toFixed(10));
    const [integerPart, decimalPart = ''] = rounded.toString().split('.');
    const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const trimmedDecimal = decimalPart.replace(/0+$/, '');

    return trimmedDecimal ? `${groupedInteger},${trimmedDecimal}` : groupedInteger;
};