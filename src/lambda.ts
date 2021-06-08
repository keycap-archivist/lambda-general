import awsLambdaFastify from 'aws-lambda-fastify';
import app from './app';

const proxy = awsLambdaFastify(app);
const f = function (event, context, callback) {
  if (event.cookies && event.cookies.length) {
    event.headers['cookie'] = event.cookies.join(';');
  }
  return proxy(event, context, callback);
};
module.exports.handler = f;
