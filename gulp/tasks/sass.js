var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    config = require('../config').sass;

gulp.task('sass', function() {
    return gulp.src(config.src)
        .pipe(sass({ style: 'expanded' }))
        .pipe(gulp.dest(config.temp))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest(config.dest));
});
