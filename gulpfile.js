// Modules
var gulp = require('gulp'),
    del = require('del'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
		rename = require('gulp-rename'),
    cleanCSS = require('gulp-clean-css'),
    combineMq = require('gulp-combine-mq'),
    strip = require('gulp-strip-css-comments'),
    bless = require('gulp-bless'),
    gzip = require('gulp-gzip'),
    size = require('gulp-size'),
    browserSync = require('browser-sync').create();

var supportedBrowsers = [
  	'> 1%',
  	'Last 2 versions',
  	'IE 11',
  	'IE 10',
  	'IE 9',
];

// Clean the build directory

gulp.task('clean', function () {
  return del([
    './build/**/*'
  ]);
});

// browserSync

gulp.task('serve', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch("demo/*.html").on('change', browserSync.reload);
});

// Compile Our Sass

gulp.task('build', function() {
    return gulp.src('src/*.scss')
        .pipe(sass({
            outputStyle: 'compact',
            errLogToConsole: true,
            quiet: true,
        }).on('error', sass.logError))
        .pipe(strip())
				.pipe(
		      autoprefixer({
		        browsers: supportedBrowsers,
		        cascade: false,
		      })
		    )
        .pipe(combineMq({
            beautify: true
        }))
        .pipe(rename('united.css'))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
        .pipe(browserSync.stream());
});

gulp.task('package', function() {
    return gulp.src('build/united.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
				.pipe(rename('united.min.css'))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
        .pipe(gzip({ extension: 'zip' }))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
});

gulp.task('bless', function() {
    return gulp.src('build/united.css')
        .pipe(rename('united-bless.css'))
        .pipe(bless({
    	 		suffix: '-part-',
          cacheBuster: false,
          imports: false,
  	    }))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
});


// Process the files in series

gulp.task('process', gulp.series('clean', 'build', 'package', 'bless'));

// Watch for changes

gulp.task('watch', function() {
    gulp.watch('src/**/*.scss', gulp.series('process'));
 });


// Default Task

gulp.task('default', gulp.parallel('serve', gulp.series( 'process', 'watch')));
