/*
 * grunt-aws-swaggerimport
 * https://github.com/simplemerchant/grunt-aws-swaggerimport#readme
 *
 * Copyright (c) 2016 Simple Merchant
 * Licensed under the MIT license.
 */

'use strict';

var AWS = require('aws-sdk');
var _ = require('lodash');

var LATEST_API_GATEWAY_API = '2015-07-09';
var IMPORT_TASK_NAME = 'import_swagger';

var fs = require('fs');

module.exports = function (grunt) {

  function _importParam(name, target) {
    return IMPORT_TASK_NAME + '.' + target + '.' + name;
  }

  function _loadSwaggerData(swaggerConfig, callback) {
    var swaggerType = Object.prototype.toString.call(swaggerConfig);
    if (swaggerType === '[object String]') {
      grunt.log.writeln('Loading Swagger from file: ' + swaggerConfig);
      fs.readFile(
        swaggerConfig,
        function (err, data) {
          if (err) {
            return callback(err);
          } else {
            return callback(null, data);
          }
        }
      );
    } else if (swaggerType === '[object Object]') {
      grunt.log.writeln('Loading inline');
      callback();
    } else {
      callback(new Error(
        'Invalid swagger_config. Use a filename string or a config object'
      ));
    }
  }

  function _importApi(
    swaggerData,
    updateConfig,
    callback
  ) {

    var apigateway = new AWS.APIGateway();
    var params = {
      body: swaggerData,
      failOnWarnings: true
    };
    var importParams = params;
    var importMethod;

    var importComplete = function importCompleteFn(err, data) {
      if (err) {
        grunt.log.writeln(err);
        return callback(err);
      } else {
        var util = require('util');
        console.log(util.inspect(data, {
          showHidden: false,
          depth: null
        }));
        grunt.log.writeln('Import Successful');
        return callback(null, data);
      }
    };

    if (updateConfig) {
      if (!updateConfig.restApiId) return callback(
        'restApiId must be provided if update API params are provided'
      );

      importParams = _.extend(params, updateConfig);
      grunt.log.writeln('Updating existing API: ' + importParams.restApiId);

      return apigateway.putRestApi(importParams, importComplete);
    } else {
      importMethod = apigateway.importRestApi;
      grunt.log.writeln('No update params. Creating new API');

      return apigateway.importRestApi(importParams, importComplete);
    }
  }

  grunt.registerMultiTask(
    IMPORT_TASK_NAME,
    'Grunt plugin to configure AWS API Gateway via a Swagger config',
    function () {

      var updateParams = _importParam('update', this.target);

      // var deploymentParams = _importParam('deployment', this.target);
      var swaggerConfigParams = _importParam('swagger_config', this.target);

      grunt.config.requires(swaggerConfigParams);

      // var deploymentSetup = grunt.config.get(deploymentParams);
      var updateConfig = grunt.config.get(updateParams);
      var swaggerConfig = grunt.config.get(swaggerConfigParams);

      // Merge task-specific and/or target-specific options with these defaults.
      // Options
      var options = this.options({
        profile: null,
        accessKeyId: null,
        secretAccessKey: null,
        credentialsJSON: null,
        region: 'us-east-1'
      });

      // Init credentials
      if (options.profile) {
        var credentials = new AWS.SharedIniFileCredentials({
          profile: options.profile
        });
        AWS.config.credentials = credentials;
      } else if (options.accessKeyId && options.secretAccessKey) {
        AWS.config.update({
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey
        });
      } else if (options.credentialsJSON) {
        AWS.config.loadFromPath(options.credentialsJSON);
      }

      // Configure region and API versions
      AWS.config.update({
        region: options.region
      });
      AWS.config.apiVersions = {
        apigateway: LATEST_API_GATEWAY_API,
      };

      // Deploy
      var done = this.async();

      return _loadSwaggerData(
        swaggerConfig,
        function (err, swaggerData) {
          if (err) {
            grunt.fail.fatal(err);
            return done(err);
          } else {
            _importApi(
              swaggerData,
              updateConfig,
              function (err, response) {
                if (err) {
                  grunt.fail.fatal(err);
                  done(err);
                } else {
                  grunt.log.writeln(response);
                  return done(null, response);
                }
              }
            );
          }
        }
      );
    }
  );
};
