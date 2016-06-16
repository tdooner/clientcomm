"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");

// Compile all SASS into CSS and place in Public folder under CSS
gulp.task("sass", function () {
  gulp.src("./gulp/sass/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./public/css"));
});

// Tell Gulp to watch the sass folder for changes
gulp.task("sass:watch", function () {
  gulp.watch("./gulp/sass/**/*.scss", ["sass"]);
});