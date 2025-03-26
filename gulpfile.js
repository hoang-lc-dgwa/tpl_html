import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("module", pathToFileURL("./"));
register("ts-node/esm", pathToFileURL("./"));

import browserSync from "browser-sync";
import cpx from "cpx";
import gulp from "gulp";
import autoprefixer from "gulp-autoprefixer";
import babel from "gulp-babel";
import htmlhint from "gulp-htmlhint";
import imagemin from "gulp-imagemin";
import notify from "gulp-notify";
import plumber from "gulp-plumber";
import prettyHtml from "gulp-pretty-html";
import gulpSass from "gulp-sass";
import sourcemaps from "gulp-sourcemaps";
import ssi from "gulp-ssi";
import wait from "gulp-wait";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import { sync as rimraf } from "rimraf";
import * as sass from "sass";
const config = JSON.parse(fs.readFileSync("./package.json", "utf8")).config;
let env = {};
try {
  env = JSON.parse(fs.readFileSync("./env.json", "utf8"));
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("env.json không tồn tại, sử dụng cấu hình mặc định.");
  } else {
    console.error("Lỗi khi đọc env.json:", err);
  }
}
const dir = {
  src: "./" + (config.dir?.src || "src"),
  dist: "./" + (config.dir?.dist || "dist"),
};
let devEnv = {
  proxy: "localhost/" + (config.dir?.site || "") + (config.dir?.dist || "dist"),
  port: 1111,
};
if (env.browserSync) {
  if (env.browserSync.host) {
    if (env.browserSync.path) {
      devEnv.proxy = env.browserSync.host + env.browserSync.path;
    } else {
      devEnv.proxy =
        env.browserSync.host +
        "/" +
        (config.dir?.site || "") +
        (config.dir?.dist || "dist");
    }
  }
  if (env.browserSync.port) {
    devEnv.port = env.browserSync.port;
  }
}

const SRC_PATH = dir.src;
const DIST_PATH = dir.dist;
const PUBLIC_PATH = "./public";
const assetsPath = "/assets";

const minFiles = `${DIST_PATH}/**/[^_]*.{png,jpg,gif,svg}`;
const minOptions = [
  imageminPngquant({
    quality: [0.7, 0.85],
    speed: 1,
  }),
  imageminMozjpeg({
    quality: 85,
    progressive: true,
  }),
];

const minImageFiles = () => {
  return gulp
    .src(minFiles)
    .pipe(
      imagemin(minOptions, {
        verbose: true,
      })
    )
    .pipe(gulp.dest(DIST_PATH));
};

const htmlFiles = [`${SRC_PATH}/html/**/[^_]*.{html,php}`];

const html = () => {
  return gulp
    .src(htmlFiles)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(
      prettyHtml({
        indent_size: 2,
      })
    )
    .pipe(gulp.dest(DIST_PATH));
};

const htmlSSI = () => {
  return gulp
    .src(htmlFiles)
    .pipe(
      ssi({
        root: `${SRC_PATH}/assets`,
      })
    )
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(
      prettyHtml({
        indent_size: 2,
      })
    )
    .pipe(gulp.dest(DIST_PATH));
};

const validateHTML = () => {
  return gulp
    .src(`${DIST_PATH}/**/*.html`)
    .pipe(htmlhint(".htmlhintrc"))
    .pipe(htmlhint.reporter());
};

const gulpSassCompiler = gulpSass(sass);

const cssScss = () => {
  return gulp
    .src(`${SRC_PATH}/assets/scss/**/*.scss`)
    .pipe(wait(500))
    .pipe(sourcemaps.init())
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(gulpSassCompiler())
    .pipe(
      gulpSassCompiler({
        outputStyle: "expanded",
        quietDeps: true,
      })
    )
    .pipe(
      autoprefixer({
        cascade: false,
        overrideBrowserslist: [
          "last 2 versions",
          "ie 11",
          "firefox >= 30",
          "ios >= 9",
          "android >= 4.4",
        ],
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${DIST_PATH}/assets/`))
    .pipe(browserSync.stream());
};

const script = () => {
  return gulp
    .src(`${SRC_PATH}/assets/scripts/**/[^_]*.js`)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(babel())
    .pipe(gulp.dest(`${DIST_PATH}/assets/`));
};

const staticFiles = () => {
  return gulp
    .src(`${SRC_PATH}/assets/static/**/[^_]*`, { encoding: false })
    .pipe(gulp.dest(`${DIST_PATH}/assets/`));
};

const staticFilesSSI = () => {
  return gulp
    .src(`${SRC_PATH}/assets/include/**/[^_]*`)
    .pipe(gulp.dest(`${DIST_PATH}/assets/include`));
  // .pipe(browserSync.stream());
};

const clean = (done) => {
  rimraf(DIST_PATH, done());
};

const routesOptions = {};
routesOptions[assetsPath] = `${SRC_PATH}/assets/static`;

const serve = (done) => {
  if (env.browserSync && env.browserSync.host) {
    console.log(`case 1`);
    browserSync.init({
      proxy: devEnv.proxy, // "localhost:8080/2025/03/M_Osaka/dist/"
      port: devEnv.port, // "3000"
      open: "external",
      startPath: "/",
    });
  } else {
    console.log(`case 2`);

    browserSync.init({
      server: {
        baseDir: [DIST_PATH],
        routes: routesOptions,
        middleware: [
          connectSSI({
            baseDir: DIST_PATH,
            ext: ".html",
          }),
        ],
      },
      port: devEnv.port,
      open: "external",
      startPath: "/",
    });
  }
  done();
};

const browserReload = (done) => {
  browserSync.reload();
  done();
};

const sync = (done) => {
  cpx.copy(
    `${DIST_PATH}/**/*.*`,
    PUBLIC_PATH,
    {
      clean: true,
      filter: (filePath) => !filePath.includes(".DS_Store"),
    },
    done()
  );
};

const watchFiles = (done) => {
  gulp.watch(
    `${SRC_PATH}/html/**/*.{html,php}`,
    gulp.series(html, validateHTML, browserReload)
  );
  gulp.watch(`${SRC_PATH}/assets/scss/**/*.scss`, cssScss);
  gulp.watch(
    `${SRC_PATH}/assets/static/**/*`,
    gulp.series(staticFiles, browserReload)
  );
  gulp.watch(
    `${SRC_PATH}/assets/scripts/**/*.js`,
    gulp.series(script, browserReload)
  );
  gulp.watch(
    `${SRC_PATH}/assets/include/**/*`,
    gulp.series(staticFilesSSI, html, validateHTML, browserReload)
  );

  done();
};

const buildFiles = gulp.series(
  clean,
  gulp.parallel(html, cssScss, script),
  validateHTML
);
const buildFilesInclude = gulp.series(
  clean,
  gulp.parallel(htmlSSI, cssScss, script),
  validateHTML
);

const min = gulp.series(minImageFiles);
const dev = gulp.series(
  buildFiles,
  staticFilesSSI,
  staticFiles,
  serve,
  watchFiles
);
const build = gulp.series(buildFiles, staticFilesSSI, staticFiles);
const prod = gulp.series(buildFilesInclude, staticFiles, sync);

export {
  browserReload,
  build,
  buildFiles,
  buildFilesInclude,
  clean,
  cssScss,
  dev,
  html,
  htmlSSI,
  min,
  minImageFiles,
  prod,
  script,
  serve,
  staticFiles,
  staticFilesSSI,
  sync,
  validateHTML,
  watchFiles,
};
