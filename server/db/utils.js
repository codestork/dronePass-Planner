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

/**
* input: gid
* output: geometry
*/
var getParcelGeometry = function(gid, table){
  return pg.select(st.asGeoJSON('geom'))
  .from(table || 'parcel')
  .where('gid',gid);
}

/**
* input: long, lat
* output: gid of intersecting parcels
*/
var getParcelGid = function(long, lat, table){
  return pg.select('gid')
  .from(table || 'parcel')
  .whereRaw("ST_Intersects(ST_GeographyFromText('SRID=4326;POINT("+long+" "+lat+")'), geom)");
}

/**
* input: parcel, start_time, duration
* 
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
*
*
*/
var addLandOwner = function(login, owner_authority){
  return pg('land_owner')
  .insert({
    login: login,
    owner_authority: owner_authority
  });
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

/**
*
*
*/
var addDrone = function(home, type, max_vel){
  return pg('drone')
  .insert({
    home_geom: st.geomFromGeoJSON(home),
    drone_type: type,
    max_velocity: max_vel
  });
}

module.exports = {
  getParcelGeometry:  getParcelGeometry,
  getParcelGid:       getParcelGid,
  setRestriction:     setRestriction,
  addLandOwner:       addLandOwner,
  addOwnedParcel:     addOwnedParcel,
  addDrone:           addDrone
}
