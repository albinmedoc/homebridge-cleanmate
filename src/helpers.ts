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

const formatHexLength = (hex: string): string => {
  const temp = '0'.repeat(8-hex.length) + hex;
  let out = '';
  for(let x = temp.length - 1; x > 0; x-=2) {
    out+= temp[x-1] + temp[x];
  }
  return out;
};

export { strToHex, tryParseInt, formatHexLength };