// Requis
var gulp = require('gulp');

gulp.task('three', function(){
  return gulp.src('node_modules/three/build/three.min.js')
    .pipe(gulp.dest('app/js'))
});
gulp.task('default', [ 'three' ]);

