export const maximumBingoTermLength = 80;

export function parseBingoTermLabel(value: string) {
  const label = value.normalize("NFKC").trim().replace(/\s+/g, " ");

  if (!label || label.length > maximumBingoTermLength) {
    throw new Error("Bingo terms must contain between 1 and 80 characters");
  }

  return { label, normalizedLabel: label.toLowerCase() };
}
