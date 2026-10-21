// Minimal dependency-free CSV export for admin/reporting views.

const escapeCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const toCsv = ({ headers, rows }) => {
  const headerLine = headers.map(escapeCell).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((_, columnIndex) => escapeCell(row[columnIndex] ?? "")).join(",")
  );
  return [headerLine, ...bodyLines].join("\r\n");
};

export const exportToCsv = ({ filename = "export.csv", headers, rows }) => {
  const csv = toCsv({ headers, rows });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToCsv;