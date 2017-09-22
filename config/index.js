'use strict';
const path = require('path');

const development = require(path.join(__dirname, 'evn', 'development'));
const test = require(path.join(__dirname, 'evn', 'test'));
const production = require(path.join(__dirname, 'evn', 'production'));

const defaults = {
  root: path.join(__dirname, '..')
};

module.exports = {
  development: Object.assign({}, development, defaults),
  test: Object.assign({}, test, defaults),
  production: Object.assign({}, production, defaults)
}[process.env.NODE_ENV || 'development'];