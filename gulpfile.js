const gulp = require('gulp');
const concat = require('gulp-concat');
const sass = require('gulp-sass');

gulp.task('default', ['css']);

gulp.task('watch', function() {
  gulp.watch('./src/**/*.scss', ['css']);
});

gulp.task('css', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src('./src/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./'));
});