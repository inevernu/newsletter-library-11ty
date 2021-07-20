const { watch, src, dest, parallel } = require('gulp');
const sass = require('gulp-sass')(require('node-sass'));
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
require('dotenv').config();
const gulpWhere = process.env.OUTPUT;

function cssTask() {
  return src('./_input/assets/main.scss', { allowEmpty: true })
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed'})).on('error', sass.logError)
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write('.'))
    .pipe(dest( './' + gulpWhere + '/assets/css/' ))
}

function watchFiles() {
  watch('./**/*.scss', parallel(cssTask));
};

exports.default = parallel(cssTask, watchFiles);