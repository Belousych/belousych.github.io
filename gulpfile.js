var gulp = require('gulp');
var inlinesource = require('gulp-inline-source');
 
gulp.task('inlinesource', function () {
    var options = {
        compress: false,
        attribute: false
    };
    return gulp.src('./index.html')
        .pipe(inlinesource(options))
        .pipe(gulp.dest('./out'));
});
