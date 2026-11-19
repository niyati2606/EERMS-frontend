export const isValidPersonName = (value) => {
  const name = typeof value === 'string' ? value.trim() : '';
  return /\p{L}/u.test(name) && /^[\p{L} ]+$/u.test(name);
};
