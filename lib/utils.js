const LOWER_CASE_LETTERS = Array.from({ length: 26 }).map((_, index) =>
  String.fromCharCode("a".charCodeAt(0) + index),
);
const UPPER_CASE_LETTERS = LOWER_CASE_LETTERS.map((char) => char.toUpperCase());
const NUMBERS = Array.from({ length: 10 }).map((_, index) => index);
