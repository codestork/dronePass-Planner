var db = require('./config.js');

// These are the postgis database queries

//
module.exports.getGeoJSONFromGid = function(gid){
  return knex.select(st.asGeoJSON('geom'))
  .from('parcel').where('gid',gid).toString();
}

// Client gives parcel# from local county accessor
module.exports.getGidFromParcelID = function(parcel_gid){
  return knex.select('gid')
  .from('parcel').where('parcel_gid',parcel_gid).toString();
}

// Gets Gid from coordinates (don't know of a good way to do it yet)
// Can try geometry dump, then search through it
module.exports.getGidFromCoor = function(long, lat){
  // pending
}

module.exports.setParcelRestriction = function(parcel, start_time, duration){
  return knex('restriction')
  .insert({
    owned_parcel_gid: parcel.gid,
    start_time: start_time,
    duration: duration
  }).toString();
}

// add new land owner
module.exports.addLandOwner = function(login, owner_authority){
  return knex('land_owner')
  .insert({login: login,
    owner_authority: owner_authority
  }).toString();
}

// add parcel to land owner
module.exports.addParcelToOwner = function(land_owner, parcel, restriction_height){
  return knex('owned_parcel')
  .insert({
    land_owner_id: land_owner,
    parcel_gid: parcel.gid,
    buffered_geom: parcel.lot_geom,
    restriction_height: restriction_height,
    srid: parcel.srid
  }).toString();
}

// Give home as point in GeoJSON
// type is a String
// max_velocity is an Integer
module.exports.addDrone = function(home, type, max_vel){
  return knex('drone')
  .insert({
    home_geom: st.geomFromGeoJSON(home),
    drone_type: type,
    max_velocity: max_vel
  })
}

// Should probably only be used once after adding Drone
// initiates heading as 0
module.exports.initDronePos = function(drone){
  var date = new Date;
  return knex('drone_position')
  .insert({
    drone_id: drone.gid,
    position_geom: drone.home_geom,
    epoch: date
  })
}

// Updates drone position in DB
module.exports.updateDronePos = function(){
  // pending
}

// Add flight path
module.exports.addFlightPath = function(){
  
}

//
module.exports.isDronePathConflict = function(drone){
  // pending

  // get flight path & start time
  // @ max_velocity will drone pos be w/in restricted area
}
