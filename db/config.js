var pg = require('pg');
// var connString = 'postgres://username:password@address/database';
var knex = require('knex')({
  dialect: 'postgres'
});
var st = require('knex-postgis')(knex);

module.exports.pg = pg;
module.exports.knex = knex;
module.exports.st = st;
