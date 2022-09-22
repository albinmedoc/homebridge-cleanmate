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

export { strToHex, tryParseInt };