/**
* Trims extra spaces and converts text to Proper Case (e.g., " jOHn " -> "John")
*/
export function sanitizeText(text: string): string {
if (!text) return '';
return text
.trim()
.toLowerCase()
.replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

/**
* Standardizes US phone numbers into (XXX) XXX-XXXX format
*/
export function formatPhoneNumber(phone: string): string {
if (!phone) return '';
const digits = ('' + phone).replace(/\D/g, ''); // Strip non-numeric characters

if (digits.length === 10) {
return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
if (digits.length === 11 && digits.startsWith('1')) {
return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
}

return phone.trim();
}

/**
* Converts date strings into abbreviated format (e.g., "1/10/2026" -> "10 JAN 2026")
*/
export function formatDateDisplay(dateStr: string): string {
if (!dateStr) return '';
const date = new Date(dateStr);
if (isNaN(date.getTime())) return dateStr.trim();

const day = String(date.getDate()).padStart(2, '0');
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const month = months[date.getMonth()];
const year = date.getFullYear();

return `${day} ${month} ${year}`;
}

