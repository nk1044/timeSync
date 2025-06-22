const isValidTimeString = (value: string): boolean =>
  /^\d{2}:\d{2}$/.test(value);

const isEndTimeAfterStartTime = (start: string, end: string): boolean => {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  return endH > startH || (endH === startH && endM > startM);
};

export {
    isValidTimeString,
    isEndTimeAfterStartTime,
}