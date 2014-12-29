var pg = require('./config.js');
var st = require('knex-postgis')(pg);

/**
* input: gid
* output: geometry
*/
var getGeoJSONFromGid = function(gid, table){
  return pg.select(st.asGeoJSON('geom'))
  .from(table || 'parcel')
  .where('gid',gid);
}

/**
* input: long, lat
* output: gid of intersecting parcels
*/
var getGidFromCoor = function(long, lat, table){
  return pg.select('gid')
  .from(table || 'parcel')
  .whereRaw("ST_Intersects(ST_GeographyFromText('SRID=4326;POINT("+long+" "+lat+")'), geom)");
}

/**
* input: parcel, start_time, duration
* 
*/
var setParcelRestriction = function(parcel, start_time, duration){
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

// add parcel to land owner
var addParcelToOwner = function(land_owner, parcel, restriction_height){
  return pg('owned_parcel')
  .insert({
    land_owner_id: land_owner,
    parcel_gid: parcel.gid,
    buffered_geom: parcel.lot_geom,
    restriction_height: restriction_height,
    srid: parcel.srid
  });
}

// Give home as point in GeoJSON
// type is a String
// max_velocity is an Integer
var addDrone = function(home, type, max_vel){
  return pg('drone')
  .insert({
    home_geom: st.geomFromGeoJSON(home),
    drone_type: type,
    max_velocity: max_vel
  });
}

// Should probably only be used once after adding Drone
// initiates heading as 0
var initDronePos = function(drone){
  var date = new Date;
  return pg('drone_position')
  .insert({
    drone_id: drone.gid,
    position_geom: drone.home_geom,
    epoch: date
  });
}

// Updates drone position in DB
var updateDronePos = function(){
  // pending
}

// Add flight path
var addFlightPath = function(){
  
}

//
var isDronePathConflict = function(drone){
  // pending

  // get flight path & start time
  // @ max_velocity will drone pos be w/in restricted area
}

module.exports.getGeoJSONFromGid = getGeoJSONFromGid;
module.exports.getGidFromParcelID = getGidFromParcelID;
module.exports.getGidFromCoor = getGidFromCoor;
module.exports.setParcelRestriction = setParcelRestriction;
module.exports.addLandOwner = addLandOwner;
module.exports.addParcelToOwner = addParcelToOwner;
module.exports.addDrone = addDrone;
module.exports.initDronePos = initDronePos;
module.exports.updateDronePos = updateDronePos;
module.exports.addFlightPath = addFlightPath;
module.exports.isDronePathConflict = isDronePathConflict;
