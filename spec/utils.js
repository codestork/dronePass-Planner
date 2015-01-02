var path = require('path');
var expect = require('chai').expect;

var utils = require(path.join(__dirname, '..', './db/utils.js'));

describe('utils()', function () {
  'use strict';

  it('exists', function () {
    expect(utils.getParcelGeometry).to.be.a('function');
  });

  it('should return a geometry', function() {
    var knexQ = utils.getParcelGeometry(0).then(function(row) {
      
    });
    // var d1 = new Date;
//   d1d = new Date;
//   console.log(r);
//   console.log('geog',(d1d-d1)+'ms');
// });
  });

  it('does something', function () {
    expect(true).to.equal(true);
  });

  it('does something else', function () {
    expect(false).to.equal(false);
  });

  // Add more assertions here
});
