// Karma configuration
// Generated on Sat Apr 16 2016 22:57:25 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      // Vendors
      {pattern: 'node_modules/angular/angular.js', included: true, watch: false},
      {pattern: 'node_modules/angular-mocks/angular-mocks.js', included: true, watch: false},
      {pattern: 'node_modules/angular-resource/angular-resource.js', included: true, watch: false},
      {pattern: 'node_modules/angular-messages/angular-messages.js', included: true, watch: false},
      {pattern: 'node_modules/angular-animate/angular-animate.js', included: true, watch: false},
      {pattern: 'node_modules/angular-aria/angular-aria.js', included: true, watch: false},
      {pattern: 'node_modules/angular-material/angular-material.js', included: true, watch: false},
      {pattern: 'node_modules/angular-ui-router/release/angular-ui-router.js', included: true, watch: false},
      {pattern: 'node_modules/moment/moment.js', included: true, watch: false},
      {pattern: 'node_modules/moment/locale/fr.js', included: true, watch: false},
      {pattern: 'node_modules/angular-moment/angular-moment.js', included: true, watch: false},
      {pattern: 'node_modules/angular-material-data-table/dist/md-data-table.js', included: true, watch: false},
      {pattern: 'node_modules/angular-chart.js/angular-chart.js', included: false, watch: false},

      // Build client code
      {pattern: 'public/js/app.js', included: true},

      // Tests
      {pattern: 'spec/client/**/*Spec.js', included: true}
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
