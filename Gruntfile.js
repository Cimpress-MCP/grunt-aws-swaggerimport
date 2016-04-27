/*
 * grunt-aws-swaggerimport
 * https://github.com/simplemerchant/grunt-aws-swaggerimport#readme
 *
 * Copyright (c) 2016 Simple Merchant
 * Licensed under the MIT license.
 */

'use strict';

require('dotenv').load();

module.exports = function (grunt) {
  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    import_swagger: {
      options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      },
      default: {
        update: {
          restApiId: process.env.DEPLOY_API_ID,
          mode: 'overwrite',
        },
        deployment: {
          stageName: 'test',
          cacheClusterEnabled: true,
          cacheClusterSize: '0.5',
          description: 'My deployment ' + Date.now(),
          stageDescription: 'My awesome stage'
        },
        swagger_config: 'test-api.json'
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'import_swagger', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
