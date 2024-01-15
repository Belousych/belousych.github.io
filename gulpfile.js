var gulp = require('gulp');
var inlinesource = require('gulp-inline-source');
var rename = require('gulp-rename');

 
gulp.task('inlinesource', function () {
    var options = {
        compress: false,
        attribute: false
    };
    return gulp.src('./index.html')
        .pipe(inlinesource(options))
        .pipe(rename('indexNew.html'))
        .pipe(gulp.dest('.'));
});
