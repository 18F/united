// Modules
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
		rename = require('gulp-rename'),
    cleanCSS = require('gulp-clean-css');

var supportedBrowsers = [
  	'> 1%',
  	'Last 2 versions',
  	'IE 11',
  	'IE 10',
  	'IE 9',
];

// Compile Our Sass

gulp.task('sass', function() {
    return gulp.src('src/*.scss')
        .pipe(sass({
            errLogToConsole: true,
            quiet: true
        }).on('error', sass.logError))
				.pipe(
		      autoprefixer({
		        browsers: supportedBrowsers,
		        cascade: false,
		      })
		    )
        .pipe(cleanCSS({compatibility: 'ie8'}))
				.pipe(rename('united.css'))
        .pipe(gulp.dest('./'))
});


// Watch for changes

gulp.task('watch', function() {
    gulp.watch('src/*.scss', ['sass']);
});


// Default Task

gulp.task('default', ['sass', 'watch']);
