import awsLambdaFastify from 'aws-lambda-fastify';
import app from './app';

const proxy = awsLambdaFastify(app, { serializeLambdaArguments: false });

module.exports.handler = proxy;
