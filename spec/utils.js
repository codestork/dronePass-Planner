var path = require('path');
var expect = require('chai').expect;
var pg = require(path.join(__dirname, '..', './server/db/config.js'));
var st = require('knex-postgis')(pg);

var utils = require(path.join(__dirname, '..', './server/db/utils.js'));

var getLandOwner = function(where){
  return pg.select()
  .from('land_owner')
  .where(where);
}

//                  List of relations
//  Schema |         Name          | Type  |   Owner   
// --------+-----------------------+-------+-----------
//  public | drone                 | table | dronepass
//  public | drone_operator        | table | dronepass
//  public | drone_position        | table | dronepass
//  public | flight_path           | table | dronepass
//  public | flight_path_buffered  | table | dronepass
//  public | land_owner            | table | dronepass
//  public | landing_zone          | table | dronepass
//  public | owned_parcel          | table | dronepass
//  public | parcel                | table | dronepass
//  public | parcel_wgs84          | table | dronepass
//  public | restriction_exception | table | dronepass
//  public | spatial_ref_sys       | table | dronepass

var LAND_OWNER_ID_ADD = 23;
var LAND_OWNER_ID_REMOVE = 24;
var LAND_OWNER_ID_TEST = 25;
var DRONE_TYPE = 'amazon';
var INITIAL_DRONE_COUNT = -2;
var DRONE_ID;
var DRONE_OPERATOR_ID;
var TIME_OUT = 250;
var DRONE_OPERATOR_NAME = 'Bob';

describe('utils()', function () {

  before(function(done) {
    // runs before all tests in this block
    //utils.removeLandOwner(15);
    pg('drone').count('id').then(function(c) {
      INITIAL_DRONE_COUNT = parseInt(c[0].count);
    });
    utils.addLandOwner(LAND_OWNER_ID_REMOVE, 'yo@yo.yo', 1).then(function(r) {
    });
    utils.addDroneOperator(DRONE_OPERATOR_NAME).then(function(r) {
    });


    setTimeout(function() {
      done();
    }, TIME_OUT);

  });

  after(function(done){
    // runs after all tests in this block
    utils.removeLandOwner(LAND_OWNER_ID_ADD).exec(function(err, rows) {
      utils.removeLandOwner(LAND_OWNER_ID_REMOVE).exec(function(err, rows) {
        done();
      })
    });
  });

  it('exists getParcelGeometry', function () {
    expect(utils.getParcelGeometry).to.be.a('function');
  });

  it('exists getParcelGidByGeography', function () {
    expect(utils.getParcelGidByGeography).to.be.a('function');
  });
  
  it('exists getParcelGid', function () {
    expect(utils.getParcelGid).to.be.a('function');
  });

  it('exists setRestriction', function () {
    expect(utils.setRestriction).to.be.a('function');
  });

  it('exists addLandOwner', function () {
    expect(utils.addLandOwner).to.be.a('function');
  });

  it('exists removeLandOwner', function () {
    expect(utils.removeLandOwner).to.be.a('function');
  });

  it('exists addParcelOwnership', function () {
    expect(utils.addParcelOwnership).to.be.a('function');
  });

  it('exists getRestricted', function() {
    expect(utils.getRestricted).to.be.a('function');
  });

  it('exists addDrone', function () {
    expect(utils.addDrone).to.be.a('function');
  });

  it('exists addDroneOperator', function () {
    expect(utils.addDroneOperator).to.be.a('function');
  });

  it('exists removeDrone', function () {
    expect(utils.removeDrone).to.be.a('function');
  });

  it('exists removeDroneOperator', function () {
    expect(utils.removeDroneOperator).to.be.a('function');
  });      

  it('should get parcel by lon lat, getParcelGid', function(done) {
    var result = {};
    utils.getParcelGid(-122.023036, 37.634351).then(function(r){
      result = r;
    });

    setTimeout(function () {
      expect(result[0].gid).to.equal(77676);
      done();
    }, TIME_OUT);
  });

  it('should get parcel by lon lat, getParcelGeometry', function(done) {
    var result = {};
    utils.getParcelGeometry(77676).then(function(r){
      result = r;
    });

    var polygon = {"type":"MultiPolygon","coordinates":[[[[1865410.8204196,627462.763510121],[1865873.94942408,627119.111182495],[1865873.12517651,627119.118531488],[1866074.85963326,626970.081381796],[1865977.92877687,626878.934414863],[1865929.46274916,626833.361530926],[1865926.9283136,626830.883218456],[1865922.52611216,626826.579106735],[1865897.66226462,626837.085304283],[1865896.99292609,626837.369052766],[1865857.45754921,626832.865009757],[1865825.89544279,626813.385537213],[1865816.63470614,626798.302773706],[1865770.21966629,626744.556649335],[1865769.32660895,626743.569718273],[1865768.41676496,626742.59833613],[1865767.48986356,626741.643392529],[1865766.54741324,626740.70156108],[1865765.58697724,626739.781969999],[1865764.61164985,626738.876690117],[1865763.62073486,626737.98850631],[1865762.61458037,626737.117689336],[1865761.59229679,626736.264548621],[1865760.54529738,626735.42088424],[1865759.50595639,626734.612533704],[1865758.44089394,626733.814278366],[1865757.3607467,626733.035826627],[1865756.26984673,626732.273813425],[1865755.16556386,626731.532222686],[1865754.04724054,626730.809855371],[1865752.91704279,626730.106982223],[1865751.77678853,626729.423603242],[1865751.16871739,626729.076460028],[1865750.61854858,626728.762193884],[1865749.45481622,626728.118770221],[1865748.27862925,626727.4972775],[1865747.09134144,626726.89585913],[1865745.89384239,626726.314979261],[1865744.68620947,626725.755024685],[1865743.94399987,626725.427104885],[1865743.46882947,626725.217078409],[1865742.24263067,626724.699825351],[1865741.0075744,626724.203613617],[1865739.76397009,626723.730261117],[1865738.51216585,626723.278220699],[1865737.76724873,626723.023133288],[1865737.25243244,626722.847260288],[1865735.9859689,626722.439120428],[1865735.389192,626722.258064452],[1865734.71223372,626722.053220948],[1865734.1538263,626721.89417327],[1865734.03798297,626721.861528272],[1865733.43358632,626721.688710904],[1865732.14550127,626721.347330846],[1865730.85436058,626721.029119454],[1865729.55652845,626720.731910709],[1865728.25440295,626720.459147039],[1865726.94682372,626720.207656769],[1865726.18573881,626720.075065466],[1865725.63707848,626719.981191751],[1865724.93787983,626719.8708795],[1865724.32064179,626719.774530337],[1865721.72617656,626719.438642684],[1865665.07379627,626719.36673859],[1865660.93673875,626719.361555617],[1865321.66622878,626768.313429118],[1864920.70103981,626826.149345371],[1865410.8204196,627462.763510121]]]]};
    var str =JSON.stringify(polygon);
    setTimeout(function () {
      expect(result[0].lot_geom).to.equal(str);
      done();
    }, TIME_OUT);
  });

  it('should create a land lowner', function(done) {
    var result = {};

    utils.addLandOwner(LAND_OWNER_ID_ADD, 'yo@yo.yo', 1).returning('id').then(function(r) {
      getLandOwner({id:LAND_OWNER_ID_ADD}).then(function(rows) {
        result = rows;
      });
    });
    
    setTimeout(function () {
      expect(result[0].id).to.equal(LAND_OWNER_ID_ADD);
      expect(result.length).to.equal(1);
      expect(result[0].login).to.equal('yo@yo.yo');
      done();
    }, TIME_OUT);
  });

  it('should remove a land owner', function(done) {
    var result = {};
    utils.removeLandOwner(LAND_OWNER_ID_REMOVE).exec(function() {
      getLandOwner({id:LAND_OWNER_ID_REMOVE}).then(function(rows) {
        result = rows;
      });
    }).catch(function(error) {
      expect(true).to.equal(false);
    });

    setTimeout(function() {
      expect(result.length).to.equal(0);
      done();
    }, TIME_OUT);
  });

  it('should add drone', function(done) {
    var count = 0;
    var droneId = -1;
    
    utils.addDrone(DRONE_TYPE, 4).returning('id').then(function(r) {
      DRONE_ID = r[0];
      pg('drone').count('id').then(function(c) {
        count = c;
      });
    });

    setTimeout(function() {
      expect(parseInt(count[0].count)).to.equal(INITIAL_DRONE_COUNT + 1);
      done();
    }, TIME_OUT);
  });

  it('should remove drone', function(done) {
    // this test requires that the 'should add drone' test runs successfully
    var countBefore = -1;
    var countAfter = -1;
    
    pg('drone').count('id').then(function(c) {
      countBefore = parseInt(c[0].count);
      utils.removeDrone(DRONE_ID).exec(function() {
        pg('drone').count('id').then(function(c) {
          countAfter = parseInt(c[0].count);
        });
      });
    });

    setTimeout(function() {
      expect(parseInt(countBefore - 1)).to.equal(countAfter);
      done();
    }, TIME_OUT);
  });

  it('should add drone operator', function(done) {
    utils.addDroneOperator(DRONE_OPERATOR_NAME).returning('id').then(function(r){
      DRONE_OPERATOR_ID = r[0];
    });

    setTimeout(function() {
      expect(DRONE_OPERATOR_ID).to.be.an('number');
      done();
    }, TIME_OUT);
  });

  it('should remove drone operator', function(done) {
    var countBefore = -1;
    var countAfter = -1;
    pg('drone_operator').count('id').then(function(c) {
      countBefore = parseInt(c[0].count);
      utils.removeDroneOperator(DRONE_OPERATOR_ID).exec(function() {
        pg('drone_operator').count('id').then(function(c) {
          countAfter = parseInt(c[0].count);
        });
      });
    });

    setTimeout(function() {
      expect(parseInt(countBefore - 1)).to.equal(countAfter);
      done();
    }, TIME_OUT);
  });

  it('should add flight path', function(done) {
    setTimeout(function() {
      expect(false).to.equal(true);
      done();
    }, TIME_OUT);
  });

  it('should remove flight path?', function(done) {
    setTimeout(function() {
      expect(false).to.equal(true);
      done();
    }, TIME_OUT);
  });          
});
