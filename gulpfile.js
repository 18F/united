// Modules
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
    browserSync = require('browser-sync').create();

var supportedBrowsers = [
  	'> 1%',
  	'Last 2 versions',
  	'IE 11',
  	'IE 10',
  	'IE 9',
];

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: 'Rebuilding...'
};

const UNITED_OVERRIDE = 'src/overrides';
const UNITED_OVERRIDE_DIR = path.join(__dirname, ...UNITED_OVERRIDE.split('/'));


// Clean the build directory

gulp.task('clean', function () {
  return del([
    './build/*.css'
  ]);
});

// Sync fonts

gulp.task('fontsync', function() {
   return gulp.src('./18Franklin/fonts/webfonts/**/*.{ttf,woff,woff2,eot}')
   .pipe(gulp.dest('./src/prototypes/fonts'));
});


// Compile Our Sass

gulp.task('compile', function() {
    return gulp.src('src/*.scss')
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
        .pipe(gulp.dest('./build/'))
        .pipe(gulp.dest('./build/prototypes/css'))
        .pipe(gulp.dest('./src/prototypes/css'))
        .pipe(size())
        .pipe(browserSync.stream());
});

gulp.task('package', function() {
    return gulp.src('build/united.css')
        .pipe(cleanCSS({
          compatibility: 'ie8',
          level: 2,
        }))
				.pipe(rename('united.min.css'))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
        .pipe(gzip({ extension: 'zip' }))
        .pipe(gulp.dest('./build/'))
        .pipe(size())
});

gulp.task('subset', function() {
    return gulp.src('build/united.css')
      .pipe(uncss({
        html: ['build/**/*.html']
      }))
      .pipe(cleanCSS({ compatibility: 'ie8' }))
      .pipe(rename('united.app.css'))
      .pipe(gulp.dest('./src/prototypes/css'))
      .pipe(size())
      .pipe(gzip({ extension: 'zip' }))
      .pipe(gulp.dest('./src/prototypes/css'))
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

gulp.task('process', gulp.series('clean', 'compile'));

// build jekyll

gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

// rebuild jekyll and reload

gulp.task('jekyll-rebuild', gulp.series('jekyll-build'), function () {
    browserSync.reload();
});

gulp.task('serve', function() {
    browserSync.init({
        server: {
          baseDir: 'build/prototypes'
        }
    });
    gulp.watch("build/prototypes/**/*.html").on('change', browserSync.reload);
});

// Watch for changes

gulp.task('watch', function() {
    gulp.watch('./18Franklin/fonts/webfonts/**/*.{ttf,woff,eof,svg}', gulp.series('fontsync'))
    gulp.watch('src/**/*.scss', gulp.series('process'));
    gulp.watch(['src/prototypes/**/*', '!src/prototypes/css/*'], gulp.series('jekyll-rebuild', 'subset'));
//    gulp.watch(['src/prototypes/**/*', '!src/prototypes/css/*'], gulp.series('jekyll-rebuild'));
    gulp.watch(['src/prototypes/css/*'], gulp.series('jekyll-rebuild'));
 });


// Default Task

gulp.task('default', gulp.series('fontsync', 'process', 'subset', 'jekyll-build', gulp.parallel('serve', 'watch')));
