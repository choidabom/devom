const ABSOLUTE_PATH_REGEX = /^(?:\/|(?:[A-Za-z]:)?[/\\|])/;
const RELATIVE_PATH_REGEX = /^\.?\.(\/|$)/;

export const isAbsolute = (path: string): boolean => ABSOLUTE_PATH_REGEX.test(path);
export const isRelative = (path: string): boolean => RELATIVE_PATH_REGEX.test(path);
