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
var getParcelGid = function(longitude, latitude){
  var longitude=-122.023036, latitude=37.634351;
  return pg.select('gid')
  .from('parcel_wgs84')
  .whereRaw("ST_Intersects(ST_GeographyFromText('SRID=4326;POINT("+longitude+" "+latitude+")'), lot_geom)");
}
var d1 = new Date;
getParcelGid(-122.023036, 37.634351).then(function(r){
  d1d = new Date;
  console.log(r);
  console.log('geog',(d1d-d1)+'ms');
});

/**
* input: long, lat
* output: gid of parcel with point
*/
var getParcelGidByContains = function(longitude, latitude){
  return pg.select('gid')
  .from('parcel')
  .whereRaw("ST_Contains(ST_SetSRID(lot_geom, 102243), ST_Transform(ST_GeometryFromText('POINT("+longitude+" "+latitude+")',4326), 102243))");
}
var d2 = new Date;
getParcelGidByContains(-122.023036, 37.634351).then(function(r){
  d2d = new Date;
  console.log(r);
  console.log('geom',(d2d-d2)+'ms');
});

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
* input:  home (GeoJSON point)
*         drone type
*         max velocity
*
* output: query that returns a promise
*/
var addDrone = function(home, type, max_vel){
  return pg('drone')
  .insert({
    home_geom: st.geomFromGeoJSON(home),
    drone_type: type,
    max_velocity: max_vel
  });
}

module.exports.getParcelGeometry = getParcelGeometry;
module.exports.getParcelGid = getParcelGid;
module.exports.setRestriction = setRestriction;
module.exports.addLandOwner = addLandOwner;
module.exports.addOwnedParcel = addOwnedParcel;
module.exports.addDrone = addDrone;
