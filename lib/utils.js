const LOWER_CASE_LETTERS = Array.from({ length: 26 }).map((_, index) =>
  String.fromCharCode("a".charCodeAt(0) + index),
);
const UPPER_CASE_LETTERS = LOWER_CASE_LETTERS.map((char) => char.toUpperCase());
const NUMBERS = Array.from({ length: 10 }).map((_, index) => index);
const SPECIAL_CHARACTERS = "!@#$%^&*(-_.,+=:;?><`~".split("");

const TEST_PASSWORD = "SomeRandomPassword123";

/**
 *
 * @template T
 * @param {Array<T>} array
 * @returns {T}
 */
function pickRandomFromArray(array) {
  return array[Math.round(Math.random() * (array.length - 1))];
}

/**
 *
 * @param {number} size
 * @param {boolean} useNumbers
 * @param {boolean} useUpperCase
 * @param {boolean} useSpecialCharacters
 * @returns {string}
 */
function generateRandomPassword(
  size = 16,
  useNumbers = true,
  useUpperCase = true,
  useSpecialCharacters = true,
) {
  const isNotOnlyLowerCaseLetters =
    useNumbers || useUpperCase || useSpecialCharacters;
  const password = Array.from({ length: size }).map(() =>
    pickRandomFromArray(LOWER_CASE_LETTERS),
  );

  /** @type {number[] | string[]} */
  const arrayData = [];
  if (useNumbers) arrayData.push(NUMBERS);
  if (useUpperCase) arrayData.push(UPPER_CASE_LETTERS);
  if (useSpecialCharacters) arrayData.push(SPECIAL_CHARACTERS);

  for (
    let arrayDataIndex = 0;
    arrayDataIndex < arrayData.length;
    arrayDataIndex++
  ) {
    const array = arrayData[arrayDataIndex];

    for (let i = 0; i < size; i++) {
      password.push(pickRandomFromArray(array).toString());
    }
  }

  if (isNotOnlyLowerCaseLetters) {
    for (let tick = 1; tick < 2551; tick++) {
      const currentIndex = size % tick;
      const randomPasswordIndex = Math.round(
        Math.random() * (password.length - 1),
      );

      let temp = password[currentIndex];
      password[currentIndex] = password[randomPasswordIndex];
      password[randomPasswordIndex] = temp;
    }
  }

  return password.slice(0, size).join("");
}

/**
 *
 * @param {string} password
 * @param {number} bytesSize
 * @returns {number}
 */
function calculateByteOffset(password, bytesSize) {
  let byteOffsetString = password
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0).toString(), "");

  if (byteOffsetString.length < 24) {
    byteOffsetString += byteOffsetString;
  }

  return (bytesSize % parseInt(byteOffsetString)) + 1;
}
