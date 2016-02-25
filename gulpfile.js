'use strict';
// плагины
var gulp = require('gulp'),
    watch = require('gulp-watch'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    minifyCss = require('gulp-minify-css'),
    plumber = require('gulp-plumber'),
    jade = require('gulp-jade'),
    typograf = require('gulp-typograf'),
    posthtml = require('gulp-posthtml');
//Пути фаqлов
var path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    src: {
        jade: 'src/jade/**/*.jade',
        html: 'src/*.html',
        js: 'src/js/main.js',
        style: 'src/style/main.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        jade: 'src/jade/**/*.jade',
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/style/**/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};
//настройка browser-sync
var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: false,// true для того чтобы включить туннель с внешим адресом
    host: 'localhost',
    port: 9000,
    logPrefix: "Jenovas"
};

gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('clean', function (cb) {// удаление папки build
    rimraf(path.clean, cb);
});

gulp.task('html:build', function () { //Сборка Html
    gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(rigger())// если необходимо подключаем файлы
    gulp.src(path.src.jade)//Компиляция Html файлов из JADE
        .pipe(plumber())
        .pipe(jade({
            pretty: true
        }))
        .pipe(typograf({ //Типографим тексты
            lang: 'ru',
            disable: ['ru/nbsp/initials',
                'common/symbols/cf']

        }))
        .pipe(gulp.dest(path.build.html))// сохранение html в /build
        .pipe(reload({stream: true}));// обновление в браузере
});

gulp.task('js:build', function () { //сборка JS
    gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger()) // импорт необходимых файлов  в один
        .pipe(sourcemaps.init())// строим source map
        .pipe(uglify())// минификация
        .pipe(sourcemaps.write())// Запись sourcemap
        .pipe(gulp.dest(path.build.js))// сохранение готового файла в build/js
        .pipe(reload({stream: true}));// обновление в браузере
});

gulp.task('style:build', function () { //Сборка сss
    gulp.src(path.src.style)
        .pipe(plumber())
        .pipe(sourcemaps.init())// сборка source maps
        .pipe(sass({ //компиляция и минификация в сss из sass
            includePaths: ['src/style/'],
            outputStyle: 'compressed',
            sourceMap: true,
            errLogToConsole: true
        }))
        .pipe(autoprefixer({ //расстановка вендорных префисов где это неоюходимо
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(minifyCss()) //минификация в сss при этом импортируются сss afqks d jlby
        .pipe(sourcemaps.write()) // Запись sourcemap
        .pipe(gulp.dest(path.build.css))// сохранение готового файла в build/js
        .pipe(reload({stream: true}));// обновление в браузере
});

gulp.task('image:build', function () { //сжатие изображений
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));// обновление в браузере
});

gulp.task('fonts:build', function () {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});
gulp.task('classes', function () { //cборка классов из html файла в любой файл
    return gulp.src('build/index.html')// исходный файл
        .pipe(posthtml([
            require('posthtml-classes')({
                fileSave: true,
                filePath: './src/style/partials/header.scss',// файл куда пишутся классы
                overwrite: true,
                eol: '\n',
                nested: false
            })

        ]));
});
gulp.task('build', [// сама задача на сборку проекта
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build'
]);


gulp.task('watch', function () { //наблюдение за изменениями в файлах из папки jade и запуск сборки измененных файлов
    watch([path.watch.jade], function (event, cb) {
        gulp.start('html:build');
    });

    watch([path.watch.style], function (event, cb) {//наблюдение за изменениями в файлах из папки style и запуск сборки измененных файлов
        gulp.start('style:build');
    });
    watch([path.watch.js], function (event, cb) {//наблюдение за изменениями в файлах из папки js и запуск сборки измененных файлов
        gulp.start('js:build');
    });
    watch([path.watch.img], function (event, cb) {//наблюдение за изменениями в файлах из папки img и запуск сборки измененных файлов
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function (event, cb) {//наблюдение за изменениями в файлах из папки fonts и запуск сборки измененных файлов
        gulp.start('fonts:build');
    });
});


gulp.task('default', ['build', 'webserver', 'watch']);//запуск задач, все кроме сбора классов и удаления папки build