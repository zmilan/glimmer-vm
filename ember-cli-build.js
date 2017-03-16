/*jshint node:true*/

var path = require('path');
var existsSync = require('exists-sync');
var concat = require('broccoli-concat');
var merge = require('broccoli-merge-trees');
var typescript = require('broccoli-typescript-compiler');
var transpileES6 = require('emberjs-build/lib/utils/transpile-es6');
var stew = require('broccoli-stew');
var TSLint = require('broccoli-tslinter');
var mv = stew.mv;
var find = stew.find;
var rename = stew.rename;

const buildPackages = require('./build/broccoli/build-packages');
const buildDemos = require('./build/broccoli/build-demos');
const babelHelpers = require('@glimmer/build/lib/generate-helpers');
const writeFile = require('broccoli-file-creator');

function transpile(tree, options, label) {
  return transpileES6(tree, label, options);
}

function buildTSOptions(compilerOptions) {
  var tsOptions = {
    tsconfig: {
      compilerOptions: {
        target: "es2015",
        inlineSourceMap: true,
        inlineSources: true,
        moduleResolution: "node",

        /* needed to get typescript to emit the desired sourcemaps */
        rootDir: '.',
        mapRoot: '/'
      }
    }
  };

  Object.assign(tsOptions.tsconfig.compilerOptions, compilerOptions);

  return tsOptions;
}

function buildBabelOptions(options) {
  var externalHelpers = options.shouldExternalizeHelpers || false;
  var stripRuntimeChecks = options.stripRuntimeChecks || false;

  return {
    externalHelpers: externalHelpers,
    stripRuntimeChecks: stripRuntimeChecks,
    sourceMaps: 'inline'
  };
}

function vendorPackage(name, options) {
  let include = options.include;
  let destDir = options.destDir || name;

  let packagePath = __dirname + '/node_modules/' + name;
  if (existsSync(packagePath)) {
    return find(packagePath, {
      include,
      destDir
    });
  } else {
    console.log('Warning: Package ' + name + ' not found.');
  }
}

module.exports = function(_options) {
  let packages = buildPackages();
  // let demos = buildDemos(packages);

  return packages;

  // let benchmark = vendorPackage('benchmark', {
  //   include: ['benchmark.js'],
  //   destDir: 'demos/benchmark'
  // });

  // let amd = find(packages, {
  //   include: ['@glimmer/*/amd/es5/**/*.js']
  // })

  // amd = concat(amd, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: 'demos/glimmer.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // let loaderPath = path.parse(require.resolve('loader.js'));
  // let loader = find(loaderPath.dir, {
  //   files: [ loaderPath.base ],
  //   destDir: '/assets'
  // });

  // return merge([packages, demos, benchmark, amd, loader]);

  // var options = _options || {};
  // var packages = __dirname + '/packages';
  // var tslintConfig = __dirname + '/tslint.json';
  // var babelOptions = buildBabelOptions(options);

  // var tsOptions = buildTSOptions();

  // // var benchmarkTrees = [find(__dirname + '/bench', {
  // //   include: ['*.html'],
  // //   destDir: 'bench'
  // // })];


  // if (existsSync(benchmarkPath)) {
  //   benchmarkTrees.push(find(benchmarkPath, {
  //     include: ['benchmark.js'],
  //     destDir: 'bench'
  //   }));
  // }

  // var simpleDOMPath = path.dirname(require.resolve('simple-dom'));
  // var simpleDOM = find(simpleDOMPath, {
  //   include: ['simple-dom.js']
  // });
  // /*
  //  * ES6 Build
  //  */
  // var tokenizerPath = path.join(require.resolve('simple-html-tokenizer'), '..', 'es6');
  // var tokenizerTree = find(tokenizerPath, {
  //   include: ['**/*.js'],
  //   exclude: ['**/*.d.ts']
  // });
  // var HTMLTokenizer = mv(tokenizerTree, 'simple-html-tokenizer');

  // // var tsTree = find(packages, {
  // //   include: ['**/*.ts'],
  // //   exclude: [
  // //     '**/*.d.ts',
  // //     '*/node_modules/**',
  // //     '@glimmer/*/node_modules/**'
  // //   ]
  // // });


  // // var tsLintTree = new TSLint(tsTree, {
  // //   configuration: tslintConfig
  // // });
  // /* tslint:enable:no-unused-variable */
  // // var transpiledTSLintTree = typescript(tsLintTree, tsOptions);

  // // var jsTree = typescript(tsTree, tsOptions);

  // // var libTree = find(jsTree, {
  // //   include: [
  // //     '*/index.js',
  // //     '*/lib/**/*.js',
  // //     '@glimmer/*/index.js',
  // //     '@glimmer/*/lib/**/*.js'
  // //   ]
  // // });

  // libTree = merge([libTree, HTMLTokenizer, handlebarsInlinedTrees.compiler]);

  // // var es6LibTree = mv(libTree, 'es6');

  // /*
  //  * ES5 Named AMD Build
  //  */
  // // libTree = transpile(libTree, babelOptions, 'ES5 Lib Tree');
  // // var es5LibTree = mv(libTree, 'named-amd');

  // /*
  //  * CommonJS Build
  //  */
  // // tsOptions = buildTSOptions({
  // //   module: "commonjs",
  // //   target: "es5"
  // // });

  // // var cjsTree = typescript(tsTree, tsOptions);
  // // var handlebarsPath = path.join(require.resolve('handlebars'), '..', '..', 'dist', 'cjs');

  // // cjsTree = merge([cjsTree, handlebarsPath, simpleDOM]);

  // // Glimmer packages require other Glimmer packages using non-relative module names
  // // (e.g., `glimmer-compiler` may import `glimmer-util` instead of `../glimmer-util`),
  // // which doesn't work with Node's module resolution strategy.
  // // As a workaround, naming the CommonJS directory `node_modules` allows us to treat each
  // // package inside as a top-level module.
  // // cjsTree = mv(cjsTree, 'node_modules');

  // /*
  //  * Anonymous AMD Build
  //  */
  // // var glimmerCommon = find(libTree, {
  // //   include: [
  // //     'glimmer/**/*.js',
  // //     '@glimmer/object/**/*.js',
  // //     '@glimmer/object-model/**/*.js',
  // //     '@glimmer/object-reference/**/*.js',
  // //     '@glimmer/reference/**/*.js',
  // //     '@glimmer/util/**/*.js',
  // //     '@glimmer/wire-format/**/*.js'
  // //   ]
  // // });

  // // var glimmerRuntime = find(libTree, {
  // //   include: ['@glimmer/runtime/**/*', '@glimmer/public-runtime/**/*']
  // // });

  // // var glimmerCompiler = merge([
  // //   find(libTree, {
  // //     include: [
  // //       '@glimmer/syntax/**/*.js',
  // //       '@glimmer/compiler/**/*.js',
  // //       'simple-html-tokenizer/**/*.js',
  // //       'handlebars.js',
  // //       'handlebars/**/*.js'
  // //     ]
  // //   })
  // // ]);

  // var glimmerDemos = merge([
  //   find(libTree, {
  //     include: [
  //       // '@glimmer/test-helpers/**/*.js',
  //       'glimmer-demos/**/*.js',
  //     ]
  //   })
  // ]);

  // // var glimmerBenchmarks = merge([
  // //   find(libTree, {
  // //     include: [
  // //       '@glimmer/test-helpers/**/*.js',
  // //       'glimmer-benchmarks/**/*.js',
  // //     ]
  // //   })
  // // ]);

  // var glimmerTests = merge([
  //   transpiledTSLintTree,
  //   find(jsTree, { include: ['*/tests/**/*.js', '@glimmer/*/tests/**/*.js'], exclude: ['@glimmer/node/tests/**/*.js'] }),
  //   find(jsTree, { include: ['@glimmer/test-helpers/**/*.js'] })
  // ]);

  // glimmerTests = transpile(glimmerTests, babelOptions, 'glimmer-tests');

  // // Test Assets

  // var testHarnessTrees = [
  //   find(__dirname + '/tests', {
  //     srcDir: '/',
  //     files: [ 'index.html' ],
  //     destDir: '/tests'
  //   })
  // ];

  // var qunitPath = path.join(require.resolve('qunitjs'), '..');
  // testHarnessTrees.push(mv(qunitPath, '/tests'));

  // var testHarness = merge(testHarnessTrees);

  // glimmerCommon = concat(glimmerCommon, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: '/amd/glimmer-common.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // glimmerCompiler = concat(glimmerCompiler, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: '/amd/glimmer-compiler.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // glimmerRuntime = concat(glimmerRuntime, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: '/amd/glimmer-runtime.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // glimmerDemos = concat(glimmerDemos, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: '/amd/glimmer-demos.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // glimmerBenchmarks = concat(glimmerBenchmarks, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: '/amd/glimmer-benchmarks.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // glimmerTests = concat(glimmerTests, {
  //   inputFiles: ['**/*.js'],
  //   outputFile: '/amd/glimmer-tests.amd.js',
  //   sourceMapConfig: {
  //     enabled: true,
  //     cache: null,
  //     sourceRoot: '/'
  //   }
  // });

  // var finalTrees = [
  //   testHarness,
  //   demos,
  //   merge(benchmarkTrees),
  //   glimmerCommon,
  //   glimmerCompiler,
  //   glimmerRuntime,
  //   glimmerTests,
  //   glimmerDemos,
  //   glimmerBenchmarks,
  //   cjsTree,
  //   es5LibTree,
  //   es6LibTree
  // ];

  // var loaderPath = path.parse(require.resolve('loader.js'));
  // var loader = find(loaderPath.dir, {
  //   files: [ loaderPath.base ],
  //   destDir: '/assets'
  // });

  // finalTrees.push(loader);

  // return merge(finalTrees);
};
