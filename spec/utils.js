var path = require('path');
var expect = require('chai').expect;

var utils = require(path.join(__dirname, '..', './db/utils.js'));

describe('utils()', function () {
  'use strict';

  it('exists', function () {
    expect(utils).to.be.a('function');

  });

  it('does something', function () {
    expect(true).to.equal(true);
  });

  it('does something else', function () {
    expect(false).to.equal(false);
  });

  // Add more assertions here
});
