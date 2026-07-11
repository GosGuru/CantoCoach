export const DEFAULT_TIME_ZONE = "America/Montevideo";

function dateParts(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const values = new Map(parts.map((part) => [part.type, part.value]));
	const year = values.get("year");
	const month = values.get("month");
	const day = values.get("day");

	if (!year || !month || !day) {
		throw new Error("No se pudo resolver la fecha local.");
	}

	return { year, month, day };
}

export function getLocalDateKey(
	date = new Date(),
	timeZone = DEFAULT_TIME_ZONE,
): string {
	const { year, month, day } = dateParts(date, timeZone);
	return `${year}-${month}-${day}`;
}

export function shiftDateKey(dateKey: string, days: number): string {
	const [year, month, day] = dateKey.split("-").map(Number);
	if (!year || !month || !day) throw new Error(`Fecha inválida: ${dateKey}`);

	const shifted = new Date(Date.UTC(year, month - 1, day + days));
	return [
		shifted.getUTCFullYear(),
		String(shifted.getUTCMonth() + 1).padStart(2, "0"),
		String(shifted.getUTCDate()).padStart(2, "0"),
	].join("-");
}

export function formatLocalDate(
	dateKey: string,
	locale = "es-UY",
	options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
): string {
	const [year, month, day] = dateKey.split("-").map(Number);
	if (!year || !month || !day) return dateKey;

	// Noon avoids crossing a calendar boundary because of timezone conversion.
	const date = new Date(year, month - 1, day, 12, 0, 0);
	return date.toLocaleDateString(locale, options);
}

export function startOfWeekDateKey(
	dateKey: string,
	weekStartsOn: 0 | 1 = 1,
): string {
	const [year, month, day] = dateKey.split("-").map(Number);
	if (!year || !month || !day) throw new Error(`Fecha inválida: ${dateKey}`);

	const date = new Date(Date.UTC(year, month - 1, day));
	const weekday = date.getUTCDay();
	const distance = (weekday - weekStartsOn + 7) % 7;
	return shiftDateKey(dateKey, -distance);
}
