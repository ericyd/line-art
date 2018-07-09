const gulp = require('gulp');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['js', 'css']);

gulp.task('watch', function() {
  gulp.watch('./src/*.js', ['js']);
  gulp.watch('./src/**/*.scss', ['css']);
});

gulp.task('js', function() {
  // babelify and concatenate scripts
  return gulp.src('./src/*.js')
    .pipe(sourcemaps.init())
      .pipe(concat('scripts.js'))
      .pipe(babel({
          presets: ['env']
      }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
});


gulp.task('css', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src('./src/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./'));
});