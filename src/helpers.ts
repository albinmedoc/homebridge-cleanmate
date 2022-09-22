const strToHex = (str: string): string => {
  let hex = '';
  for (let i = 0, l = str.length; i < l; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return hex;
};

const tryParseInt = (str: string) => {
  const int = parseInt(str);
  if(isNaN(int)) {
    throw new TypeError('String is not an number');
  }
  return int;
};

const stringifyRecord = (dict: Record<string, string | boolean | number>): Record<string, string> => {
  Object.keys(dict).forEach((key) => {
    let value = dict[key];
    if(typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    dict[key] = value.toString();
  });
  return dict as Record<string, string>;
};

export { strToHex, tryParseInt, stringifyRecord };