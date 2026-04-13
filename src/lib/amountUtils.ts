export function normalizeAmount(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
        return 0;
    }

    if (typeof value === 'number') {
        return Math.round(value);
    }

    let str = String(value).trim();

    str = str.replace(/[^\d.,\-]/g, '');

    if (str === '') {
        return 0;
    }

    const dotCount = (str.match(/\./g) || []).length;
    const commaCount = (str.match(/,/g) || []).length;

    if (commaCount > 0 && dotCount > 0) {
        str = str.replace(/\./g, '');
        str = str.replace(',', '.');
    } else if (commaCount === 1) {
        const afterComma = str.split(',')[1];
        if (afterComma.length <= 2) {
            str = str.replace(',', '.');
        } else {
            str = str.replace(',', '');
        }
    } else if (commaCount > 1) {
        str = str.replace(/,/g, '');
    }

    const remainingDots = (str.match(/\./g) || []).length;

    if (remainingDots > 1) {
        const lastDotIndex = str.lastIndexOf('.');
        const beforeLastDot = str.substring(0, lastDotIndex).replace(/\./g, '');
        const afterLastDot = str.substring(lastDotIndex + 1);
        if (afterLastDot.length === 3) {
            str = beforeLastDot + afterLastDot;
        } else {
            str = beforeLastDot + '.' + afterLastDot;
        }
    } else if (remainingDots === 1) {
        const afterDot = str.split('.')[1];
        if (afterDot.length === 3) {
            str = str.replace('.', '');
        }
    }

    const result = parseFloat(str);

    if (isNaN(result)) {
        return 0;
    }
    return Math.round(result);
}

export function amountsMatch(
    gobizAmount: string | number | null | undefined,
    localAmount: number
): boolean {
    return normalizeAmount(gobizAmount) === normalizeAmount(localAmount);
}
