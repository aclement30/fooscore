var dest = './public',
  src = './src';

module.exports = {
    browserSync: {
        proxy: "localhost:3000",
        //files: ["public/**/*.*"],
        //browser: "google chrome",
        //port: 7000,
        /*server: {
        // We're serving the src folder as well
        // for sass sourcemap linking
        baseDir: [dest, src]
        },*/
        serveStatic: [
            dest
        ]
        //files: [
        //    dest + '/**/*.*'
       // ]
    },
    markup: {
        src: src + "/www/**",
        dest: dest
    },
    browserify: {
        // Enable source maps
        debug: true,
        // A separate bundle will be generated for each
        // bundle config in the list below
        bundleConfigs: [
            {
                entries: src + '/js/vendors',
                dest: dest,
                outputName: 'js/vendors.js'
            },
            {
                entries: src + '/js/app',
                dest: dest,
                outputName: 'js/app.js'
            }
        ],
        extensions: ['.js']
    },
    sass: {
        src: src + '/sass/*.scss',
        dest: dest + '/css',
        temp: src + '/sass/temp'
    }
};
