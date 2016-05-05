# grunt-aws-swaggerimport

> Grunt plugin to configure AWS API Gateway via a Swagger config and configure
> lambda permissions for API gateway.

#### Originally seeded from: [grunt-aws-apigateway](https://github.com/spreaker/grunt-aws-apigateway)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-aws-swaggerimport --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-aws-swaggerimport');
```

## The "import_swagger" task

### Overview
In your project's Gruntfile, add a section named `import_swagger` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  import_swagger: {
    options: {
      accessKeyId: 'your-aws-access-key-id',
      secretAccessKey: 'your-aws-secret-access-key',
      region: 'your-aws-region', // Default: us-east-1
    },
    your_target: {
      // Include the update block if you want to update an existing API
      // A new API will be created if no update block is provided.
      update: {
        restApiId: 'id-of-api-to-update'
        mode: 'overwrite', // May be either merge or overwrite.
      },
      // Include the deployment block if you want to deploy the API to a stage.
      // See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html#createDeployment-property
      // for more info on these params.
      deployment: {
        stageName: 'test',
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',
        description: 'My deployment ' + Date.now(),
        stageDescription: 'My stage',
        variables: {
          someStageVariable: 'some-stage-variable',
        }
      },
      swagger_config: 'path/to/your/swagger-file.json',
    },
  },
})
```

### Options

#### options.accessKeyId
Type: `String`

AWS Access Key Id with which to import the API

#### options.secretAccessKey
Type: `String`

AWS Secret Access Key Id with which to import the API

#### options.region
Type: `String`

AWS region in which to import the API

### Usage Examples

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2016 Simple Merchant. Licensed under the MIT license.
