/*
 * grunt-aws-swaggerimport
 * https://github.com/simplemerchant/grunt-aws-swaggerimport#readme
 *
 * Copyright (c) 2016 Simple Merchant
 * Licensed under the MIT license.
 */

'use strict';

var AWS = require('aws-sdk');

var LATEST_API_GATEWAY_API = '2015-07-09';
var IMPORT_TASK_NAME = 'import_swagger';

module.exports = function (grunt) {

  function importParam(name, target) {
    return IMPORT_TASK_NAME + '.' + target + '.' + name;
  }

  grunt.registerMultiTask(
    IMPORT_TASK_NAME,
    'Grunt plugin to configure AWS API Gateway via a Swagger config',
    function () {

      var restApiIdParam = importParam('restApiId', this.target);
      var deploymentParam = importParam('deployment', this.target);
      var stageNameParam = importParam('deployment.stageName', this.target);
      var swaggerConfigParam = importParam('swagger_config', this.target);

      // Required config
      grunt.config.requires(restApiIdParam);
      grunt.config.requires(stageNameParam);
      grunt.config.requires(deploymentParam);
      grunt.config.requires(swaggerConfigParam);

      // Get config
      // var restApiId = grunt.config.get(restApiIdParam);
      // var deploymentSetup = grunt.config.get(deploymentParam);
      // var swaggerConfig = grunt.config.get(swaggerConfigParam);

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

      // Init API Gateway
      // var apigateway = new AWS.APIGateway();
    }
  );
};
