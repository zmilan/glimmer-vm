const fs = require('fs');
const path = require('path');

const funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');

const toES5 = require('@glimmer/build/lib/to-es5');
const compileTypescript = require('broccoli-typescript-compiler');
const Rollup = require('broccoli-rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const ts = require('typescript');
const handlebarsInliner = require('./handlebars-inliner');
const generateBabelHelpers = require('./generate-babel-helpers');

const stew = require('broccoli-stew');

module.exports = function buildDemos(_packages) {
  // Move compiled Glimmer packages to demo's node_modules directory, so they
  // can be found by both the TypeScript compiler and Rollup. We have cannot put
  // them one level higher (at `node_modules/` instead of `demos/node_modules/`
  // because the TypeScript plugin
  let packages = funnel(_packages, {
    destDir: 'demos/node_modules/'
  });

  // Babel helpers in the compiled Glimmer packages are external modules, so we
  // need to provide the helpers as an ES6 module for Rollup to find.
  let babelHelpers = generateBabelHelpers('demos/node_modules/babel-helpers/index.js');

  // Templates compiled at runtime need the Handlebars parser.
  let handlebars = funnel(handlebarsInliner.compiler, {
    destDir: 'demos/node_modules/handlebars'
  });

  let demoJS = funnel(compileTypescript('demos', {
    tsconfig: {
      compilerOptions: {
        target: 'es5',
        module: 'es2015',
        moduleResolution: 'node'
      }
    }
  }), { destDir: 'demos' });

  let js = merge([demoJS, packages, babelHelpers, handlebars]);

  let demos = fs.readdirSync('demos')
    .map(demoPath => `demos/${demoPath}`)
    .filter(demoPath => fs.statSync(demoPath).isDirectory())
    .map(rollupDemo);

  demos.push(funnel('demos', {
    include: ['**/*.html'],
    destDir: 'demos'
  }));

  return merge(demos);

  function rollupDemo(demoPath) {
    // let demoTS = funnel(demoPath, {
    //   include: ['**/*.ts'],
    //   destDir: demoPath
    // });

    // demoTS = merge([demoTS, packages, babelHelpers, handlebars]);

    // let tsconfig = fs.readFileSync('tsconfig.json').toString();
    // tsconfig = ts.parseConfigFileTextToJson('tsconfig.json', tsconfig).config;
    // Object.assign(tsconfig.compilerOptions, {
    //   module: 'es6'
    // });

    // let demoJS = compileTypescript(demoTS, {
    //   tsconfig: {
    //     compilerOptions: {
    //       target: 'es5',
    //       module: 'es2015',
    //       moduleResolution: 'node'
    //     },
    //     include: [demoPath]
    //   }
    // });

    return new Rollup(stew.debug(js, 'js'), {
      rollup: {
        entry: demoPath + '/index.js',
        // CommonJS is needed for Handlebars, although this can probably
        // be removed in the next release (after 4.0.6).
        plugins: [commonjs(), nodeResolve({ jsnext: true })],
        format: 'iife',
        moduleName: path.basename(demoPath),
        dest: demoPath + '/index.js'
      },
      annotation: 'Rollup: ' + demoPath
    });

    // let babelOptions = buildBabelOptions({});
    // let tsOptions = buildTSOptions({
    //   target: 'es2015',
    //   module: 'es6'
    // });
    // let demoJS = typescript(demos, tsOptions, 'Demo TypeScript');
    // demoJS = transpile(demoJS, babelOptions, 'Demo JS');

    // let babelHelpersTree = writeFile('babel-helpers.js', helpers('amd'));
    // demosJS = merge([demoJS, babelHelpersTree]);

    // demoJS = concat(demoJS, {
    //   inputFiles: ['**/*.js'],
    //   outputFile: 'demos.amd.js',
    //   sourceMapConfig: {
    //     enabled: true,
    //     cache: null,
    //     sourceRoot: '/'
    //   }
    // });

    // return merge([demos, demoJS]);
  }
}