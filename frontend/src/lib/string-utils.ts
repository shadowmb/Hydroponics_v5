/**
 * String manipulation utilities.
 */

/**
 * Map of Cyrillic characters to their Latin equivalents.
 * Based on standard transliteration systems.
 */
const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'j',
    'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
    'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'J',
    'Ю': 'Yu', 'Я': 'Ya'
};

/**
 * Transliterates a Cyrillic string to Latin characters.
 */
export function transliterate(text: string): string {
    return text.split('').map(char => CYRILLIC_TO_LATIN_MAP[char] || char).join('');
}

/**
 * Converts a string into a URL-friendly slug.
 * 1. Transliterates Cyrillic to Latin.
 * 2. Converts to lowercase.
 * 3. Replaces non-alphanumeric characters with underscores.
 * 4. Removes duplicate underscores and leading/trailing underscores.
 */
export function slugify(text: string): string {
    const latinText = transliterate(text);
    return latinText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric chars with underscore
        .replace(/^_+|_+$/g, '');   // Trim leading/trailing underscores
}
