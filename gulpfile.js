// ==============================================
// VARIABLES

// NPM modules

var gulp = require('gulp'),
    del = require('del'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
		rename = require('gulp-rename'),
    cleanCSS = require('gulp-clean-css'),
    combineMq = require('gulp-combine-mq'),
    strip = require('gulp-strip-css-comments'),
    uncss = require('gulp-uncss'),
    bless = require('gulp-bless'),
    gzip = require('gulp-gzip'),
    size = require('gulp-size'),
    cp = require('child_process'),
    path = require('path'),
    browserSync = require('browser-sync').create();

// Autoprefixer support

var supportedBrowsers = [
  	'> 2%'
];

// Jekyll support

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: 'Rebuilding...'
};

// United directories

const UNITED_OVERRIDE = 'src/overrides';
const UNITED_OVERRIDE_DIR = path.join(__dirname, ...UNITED_OVERRIDE.split('/'));


// ==============================================
// COMPILE THE CSS

// 1. Clean the build directory

gulp.task('sass-clean', function () {
  return del([
    './build/*.css'
  ]);
});

// - - - - - - - - - - - - - - - - - - - - - - -

// 2. Sync fonts

gulp.task('sass-fontsync', function() {
   return gulp.src('./18Franklin/fonts/webfonts/**/*.{ttf,woff,woff2,eot}')
   .pipe(gulp.dest('./src/base/prototypes/fonts'));
});

// - - - - - - - - - - - - - - - - - - - - - - -

// 3. Compile the CSS

gulp.task('sass-compile', function() {
    return gulp.src('src/base/united.scss')
        .pipe(sass({
            outputStyle: 'compact',
            errLogToConsole: true,
            quiet: true,
            includePaths: [
              UNITED_OVERRIDE_DIR,
            ]
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
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('build/prototypes/css'))
        .pipe(gulp.dest('src/base/prototypes/css'))
        .pipe(size())
        .pipe(browserSync.stream());
});

// - - - - - - - - - - - - - - - - - - - - - - -

// 5. Minify and package the CSS

gulp.task('sass-package', function() {
    return gulp.src('build/united.css')
        .pipe(cleanCSS({
          compatibility: 'ie10',
          level: 2,
        }))
				.pipe(rename('united.min.css'))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
        .pipe(gzip({ extension: 'zip' }))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
});

// ==============================================
// SUBSET

// Subset the complete CSS for a specific project

gulp.task('sass-subset', function() {
    return gulp.src('build/united.css')
      .pipe(uncss({
        html: ['build/**/*.html']
      }))
      .pipe(cleanCSS({ compatibility: 'ie8' }))
      .pipe(rename('united.app.css'))
      .pipe(gulp.dest('./src/base/prototypes/css'))
      .pipe(size())
      .pipe(gzip({ extension: 'zip' }))
      .pipe(gulp.dest('./src/base/prototypes/css'))
      .pipe(size())
});

// ==============================================
// JEKYLL

// - - - - - - - - - - - - - - - - - - - - - - -

// 1. Build the jekyll demo site

gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

// - - - - - - - - - - - - - - - - - - - - - - -

// 2. Rebuild the demo site and reload on changes

gulp.task('jekyll-serve', function() {
    browserSync.init({
        server: {
          baseDir: 'build/prototypes'
        }
    });
    gulp.watch("build/prototypes/**/*.html").on('change', browserSync.reload);
});

gulp.task('jekyll-rebuild', gulp.series('jekyll-build'), function () {
    browserSync.reload();
});


// ==============================================
// GULP TASKS

// - - - - - - - - - - - - - - - - - - - - - - -

// `gulp sass-watch`

gulp.task('sass-watch', function() {
    gulp.watch('./18Franklin/fonts/webfonts/**/*.{ttf,woff,eof,svg}', gulp.series('sass-fontsync'))
    gulp.watch('src/**/*.scss', gulp.series('sass-compile'));
 });

 // `gulp jekyll-watch`

gulp.task('jekyll-dev-watch', function() {
   gulp.watch(['src/base/prototypes/**/*'], gulp.series('jekyll-rebuild'));
});

gulp.task('jekyll-prod-watch', function() {
   gulp.watch(['src/base/prototypes/**/*', '!src/prototypes/css/*'], gulp.series('jekyll-rebuild'));
   gulp.watch(['src/base/prototypes/css/united.css'], gulp.series('sass-subset', 'jekyll-rebuild'));
});

// - - - - - - - - - - - - - - - - - - - - - - -

// `gulp sass`

gulp.task('sass', gulp.series('sass-fontsync', 'sass-clean', 'sass-compile', 'sass-watch'));

// `gulp jekyll-dev`

gulp.task('jekyll-dev', gulp.series('jekyll-build', gulp.parallel('jekyll-serve', 'jekyll-dev-watch')));

// `gulp jekyll-prod`

gulp.task('jekyll-prod', gulp.series('jekyll-build', gulp.parallel('jekyll-serve', 'jekyll-prod-watch')));


// Default Task

// gulp.task('default', gulp.series('sass', 'jekyll', 'subset', 'jekyll-build', gulp.parallel('serve', 'watch')));
