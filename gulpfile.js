(function() {
  'use strict';

  var gulp = require('gulp');
  var packageJSON = require('./package.json');
  var plugins = require('gulp-load-plugins')();
  var buildConfig = {
    fileName: packageJSON.name,
    src: ['./src/!(*.spec).js'],
    testSrc: ['./src/*.spec.js'],
    dest: './',
    inject_order: [
      '**/*.module.js',
      '*.js',
    ],
  };

  gulp.task('compile-ugly', compileUgly);
  gulp.task('compile-file', compile);
  gulp.task('compile', [
    'compile-ugly',
    'compile-file',
  ]);
  gulp.task('test', test);

  function compile() {
    return gulp.src(buildConfig.src)
      .pipe(plugins.eslint())
      .pipe(plugins.eslint.format())
      .pipe(plugins.ngAnnotate())
      .pipe(plugins.order(buildConfig.inject_order))
      .pipe(plugins.concat(buildConfig.fileName + '.js'))
      .pipe(plugins.iife({prependSemicolon: false}))
      .pipe(gulp.dest(buildConfig.dest));
  }

  function compileUgly() {
    return gulp.src(buildConfig.src)
      .pipe(plugins.ngAnnotate())
      .pipe(plugins.order(buildConfig.inject_order))
      .pipe(plugins.concat(buildConfig.fileName + '.min.js'))
      .pipe(plugins.iife({prependSemicolon: false}))
      .pipe(plugins.uglify())
      .pipe(gulp.dest(buildConfig.dest));
  }

  function test() {
    return gulp.src(buildConfig.src)
      .pipe(plugins.eslint())
      .pipe(plugins.eslint.format())
      .pipe(plugins.ngAnnotate())
      .pipe(plugins.uglify())
      .pipe(plugins.concat(buildConfig.fileName))
      .pipe(gulp.dest(buildConfig.dest));
  }
}());
