require('dotenv').config();
const gulpWhere = process.env.OUTPUT;

module.exports = {
  // Content files referencing CSS classes
  content: ['./' + gulpWhere + '/**/*.html'],

  // CSS files to be purged in-place
  css: ['./' + gulpWhere + '/assets/**/*.css'],

  fontFace: true,
  keyframes: true,
  rejected: true
};