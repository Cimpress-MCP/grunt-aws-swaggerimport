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
var Promise = require('bluebird');
var util = require('util');

var LATEST_API_GATEWAY_API = '2015-07-09';
var IMPORT_TASK_NAME = 'import_swagger';

var fs = Promise.promisifyAll(require('fs'));

module.exports = function (grunt) {

  var apigateway = Promise.promisifyAll(new AWS.APIGateway());

  function _importParam(name, target) {
    return IMPORT_TASK_NAME + '.' + target + '.' + name;
  }

  var _loadSwaggerData =
    Promise.promisify(function _loadSwaggerDataFn(swaggerConfig, callback) {
      var swaggerType = Object.prototype.toString.call(swaggerConfig);
      if (swaggerType === '[object String]') {
        grunt.log.writeln('Loading Swagger from file: ' + swaggerConfig);
        fs.readFileAsync(swaggerConfig)
          .then(function (data) {
            callback(null, data);
          })
          .catch(callback)
          .done();
      } else if (swaggerType === '[object Object]') {
        grunt.log.writeln('Loading inline');
        callback(null, JSON.stringify(swaggerConfig));
      } else {
        callback(new Error(
          'Invalid swagger_config. Use a filename string or a config object'
        ));
      }
    });

  var _importApi =
    Promise.promisify(function _importApiFn(
      swaggerData,
      updateConfig,
      callback
    ) {
      var params = {
        body: swaggerData,
        failOnWarnings: true
      };
      var importParams = params;
      var importMethod;

      var importComplete = function importCompleteFn(data) {
        grunt.log.debug(util.inspect(data, {
          showHidden: false,
          depth: null
        }));
        grunt.log.writeln('Import Successful');
        return callback(null, data);
      };

      if (updateConfig) {
        if (!updateConfig.restApiId) return callback(
          'restApiId must be provided if update API params are provided'
        );

        importParams = _.extend(params, updateConfig);
        grunt.log.writeln('Updating existing API: ' + importParams.restApiId);

        return apigateway.putRestApiAsync(importParams)
          .then(importComplete)
          .catch(callback);
      } else {
        importMethod = apigateway.importRestApi;
        grunt.log.writeln('No update params. Creating new API');

        return apigateway.importRestApiAsync(importParams)
          .then(importComplete)
          .catch(callback);
      }
    });

  var _deployStage =
    Promise.promisify(function _deployStageFn(deployConfig, callback) {
      if (!deployConfig) {
        return callback();
      }

      grunt.log.writeln('Deploying to stage', deployConfig.stageName);
      apigateway.createDeploymentAsync(deployConfig)
        .then(function (resp) {
          grunt.log.writeln('Deployment successful');
          grunt.log.debug(util.inspect(resp, {
            showHidden: false,
            depth: null
          }));
          callback();
        })
        .catch(callback);
    });

  grunt.registerMultiTask(
    IMPORT_TASK_NAME,
    'Grunt plugin to configure AWS API Gateway via a Swagger config',
    function () {

      var updateParams = _importParam('update', this.target);

      var deploymentParams = _importParam('deployment', this.target);
      var swaggerConfigParams = _importParam('swagger_config', this.target);

      grunt.config.requires(swaggerConfigParams);

      var deploymentConfig = grunt.config.get(deploymentParams);
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

      return _loadSwaggerData(swaggerConfig)
        .then(function (swaggerData) {
          return [swaggerData, updateConfig];
        })
        .spread(_importApi)
        .then(function (response) {
          if (deploymentConfig) deploymentConfig.restApiId = response.id;
          return deploymentConfig;
        })
        .then(_deployStage)
        .then(done)
        .catch(function (err) {
          grunt.fail.fatal(err);
          return done(err);
        });
    }
  );
};
