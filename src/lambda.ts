import awsLambdaFastify from '@fastify/aws-lambda';
import app from './app';

const proxy = awsLambdaFastify(app, { serializeLambdaArguments: false });

module.exports.handler = proxy;
