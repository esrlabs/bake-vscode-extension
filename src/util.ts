export class InvalidVersionString extends Error {}

export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export function versionToString(ver: Version): string { return `${ver.major}.${ver.minor}.${ver.patch}`; }

export function parseVersion(str: string): Version {
    const version_re = /(\d+)\.(\d+)\.(\d+)/;
    const mat = version_re.exec(str);
    if (!mat) {
        throw new InvalidVersionString(`Invalid version string ${str}`);
    }
    const [, major, minor, patch] = mat;
    return {
        major: parseInt(major),
        minor: parseInt(minor),
        patch: parseInt(patch),
    };
}

export enum Ordering {
    Greater,
    Equivalent,
    Less,
}

export function compareVersions(a: Version|string, b: Version|string): Ordering {
    if (typeof a === 'string') {
        a = parseVersion(a);
    }
    if (typeof b === 'string') {
        b = parseVersion(b);
    }
    // Compare major
    if (a.major > b.major) {
        return Ordering.Greater;
    } else if (a.major < b.major) {
        return Ordering.Less;
        // Compare minor
    } else if (a.minor > b.minor) {
        return Ordering.Greater;
    } else if (a.minor < b.minor) {
        return Ordering.Less;
        // Compare patch
    } else if (a.patch > b.patch) {
        return Ordering.Greater;
    } else if (a.patch < b.patch) {
        return Ordering.Less;
        // No difference:
    } else {
        return Ordering.Equivalent;
    }
}

export function versionGreater(lhs: Version|string, rhs: Version|string): boolean {
    return compareVersions(lhs, rhs) === Ordering.Greater;
}

export function versionEquals(lhs: Version|string, rhs: Version|string): boolean {
    return compareVersions(lhs, rhs) === Ordering.Equivalent;
}

export function versionLess(lhs: Version|string, rhs: Version|string): boolean {
    return compareVersions(lhs, rhs) === Ordering.Less;
}
