var pg = require('./config.js');
var st = require('knex-postgis')(pg);

/**
* All of the utility functions return a knex query
* 
* example w/ promise:
* getParcelGid(x,y,table).then(func).then(func);
*
* example w/ callback:
* getParcelGid(x,y,table).exec(callback);
*/

//*************************************************************************
//        GENERAL QUERIES
//*************************************************************************

/**
* input: gid, table
* output: knex query that selects Geometry of provided gid in provided table
*/
var getParcelGeometry = function(gid, table){
  return pg.select(st.asGeoJSON('lot_geom'))
  .from(table || 'parcel')
  .where('gid',gid);
}

// utils.getParcelGeometry(0).then(function(row) { 
//   result = row[0];
//   console.log(result);
// });

/**
* input: long, lat
* output: knex query that selects gid of Parcel that intersects with provided long lat point
*         by geography calculations (slow, exact)
*/
var getParcelGidByGeography = function(longitude, latitude){
  var longitude=-122.023036, latitude=37.634351;
  return pg.select('gid')
  .from('parcel_wgs84')
  .whereRaw("ST_Intersects(ST_GeographyFromText('SRID=4326;POINT("+longitude+" "+latitude+")'), lot_geom)");
}
// var d1 = new Date;
// getParcelGidByGeography(-122.023036, 37.634351).then(function(r){
//   d1d = new Date;
//   console.log(r);
//   console.log('geog',(d1d-d1)+'ms');
// });


/**
* input: long, lat
* output: knex query that selects gid of Parcel that intersects with provided long lat point
*         by geometry calculations (fast, estimate)
*/
var getParcelGid = function(longitude, latitude){
  return pg.select('gid')
  .from('parcel')
  .whereRaw("ST_Contains(ST_SetSRID(lot_geom, 102243), ST_Transform(ST_GeometryFromText('POINT("+longitude+" "+latitude+")',4326), 102243))");
}
// var d2 = new Date;
// getParcelGid(-122.023036, 37.634351).then(function(r){
//   d2d = new Date;
//   console.log(r);
//   console.log('geom',(d2d-d2)+'ms');
// });










//*************************************************************************
//        CLIENT SPECIFIC
//*************************************************************************

/**
* input: parcel, start_time, duration
* output:
*/
var setRestriction = function(parcel, start_time, duration){
  return pg('restriction')
  .insert({
    owned_parcel_gid: parcel.gid,
    start_time: start_time,
    duration: duration
  });
}


/**
* input:  id              (INTEGER)
*         login           (VARCHAR)
*         owner_authority (INTEGER)
* output: knex query that inserts an owner into the land_owner table
*/
var addLandOwner = function(id, login, owner_authority){
  return pg('land_owner')
  .insert({
    id: id,
    login: login,
    owner_authority: owner_authority
  });
}

/**
* input:  id  (INTEGER)
* output: knex query that removes row in land_owner table with given id
*/
var removeLandOwner = function(id){
  return pg('land_owner')
  .where('id',id)
  .delete();
}



/**
*
*
*/
var addOwnedParcel = function(land_owner, parcel, restriction_height){
  return pg('owned_parcel')
  .insert({
    land_owner_id: land_owner,
    parcel_gid: parcel.gid,
    buffered_geom: parcel.lot_geom,
    restriction_height: restriction_height,
    srid: parcel.srid
  });
}










//*************************************************************************
//        DRONE SPECIFIC
//*************************************************************************

/**
* input:  drone type
*         max velocity
* output: knex query that inserts a row to drone table
*/
var addDrone = function(type, max_vel){
  return pg('drone')
  .insert({
    drone_type: type,
    max_velocity: max_vel
  });
}

/**
* input: plan (line string)
* output: knex query that checks if string intersects with restricted
*         properties
*/
// var isFlightPlanConflictFree = function(plan){}











module.exports = {
  // General
  getParcelGeometry:  getParcelGeometry,
  getParcelGid:       getParcelGid,
  // Client
  setRestriction:     setRestriction,
  addLandOwner:       addLandOwner,
  removeLandOwner:    removeLandOwner,
  addOwnedParcel:     addOwnedParcel,
  // Drone
  addDrone:           addDrone
}
