// src/utils.js

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 * @param {Array} array
 * @returns {Array}
 */
export function shuffle(array) {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

/**
 * Debounce a function to limit how often it can fire.
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Format a date as YYYY-MM-DD HH:mm:ss
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}
