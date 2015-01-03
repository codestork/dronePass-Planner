var pg = require('./config.js');
var st = require('knex-postgis')(pg);

var BUFFER_OFFSET = 5; // 5 METERS

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
* output: knex query that selects GeoJSON Geometry of provided gid in provided table
*/
var getParcelGeometryJSON = function(gid, table){
  return pg.select(st.asGeoJSON('lot_geom'))
  .from(table || 'parcel')
  .where('gid',gid);
}



/**
* input: gid, table
* output: knex query that selects Text Geometry of provided gid in provided table
*/
var getParcelGeometryText = function(gid, table){
  return pg.select(st.asText('lot_geom'))
  .from(table || 'parcel')
  .where('gid',gid);
}


/**
* input:  Geometry as Text
* output: knex query that gives Convex Hull as Text
*         result[0].st_astext holds convex hull
*/
var convertToConvexHullText = function(geoText){
  return pg.raw("SELECT ST_AsText(ST_ConvexHull(ST_GeomFromText('"+geoText+"')))");
}


/**
* input: Geometry as Text
* output: knex query that gives Convex Hull as Raw Geometry
*         result.rows[0].st_setsrid holds convex hull
*/
var convertToConvexHullRaw = function(geoText){
  return pg.raw("SELECT ST_SetSRID(ST_ConvexHull(ST_GeomFromText('"+geoText+"')), 102243)");
}


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
  .whereRaw("ST_Contains(lot_geom, ST_Transform(ST_GeometryFromText('POINT("+longitude+" "+latitude+")',4326), 102243))");
}
// var d2 = new Date;
// getParcelGid(-122.023036, 37.634351)
// .then(function(r){
//   d2d = new Date;
//   console.log(r);
//   console.log('geom',(d2d-d2)+'ms');
//   return r;
// })
// .then(function(r){
//   return getParcelGeometry(r[0].gid)
//   .then(function(geom){
//     return {gid:r[0].gid, geom: geom[0].lot_geom}
//   });
// })
// .then(console.log);










//*************************************************************************
//        CLIENT SPECIFIC
//*************************************************************************

/**
* input: parcel, start_time, duration
* output:
*/
var setRestriction = function(land_owner_id, parcel_gid, start_time, end_time){
  return pg('owned_parcel')
  .where({
    'land_owner_id' : land_owner_id,
    'parcel_gid' : parcel_gid})
  .update({
    restriction_start: start_time,
    restriction_end: end_time
  });
}


var getRestricted = function(where_obj) {
  return pg.select(['restriction_start', 'restriction_start'])
  .from('owned_parcel')
  .where(where_obj);
}

/**
* input:  id              (INTEGER)
*         login           (VARCHAR)
*         owner_authority (INTEGER)
* output: knex query that inserts an owner into the land_owner table
*/
var addLandOwner = function(id, login, owner_authority) {
  return pg('land_owner')
  .insert({
    id: id,
    login: login,
    owner_authority: owner_authority
  });
}

/**
* input:  id  (INTEGER)
* output: knex query removes row in land_owner table with given id
*/
var removeLandOwner = function(id){
  return pg('land_owner')
  .where('id',id)
  .delete();
}

var addParcelOwnership = function(land_owner_id, parcel, restriction_height){

  var parcelGeomQuery = "SELECT lot_geom FROM public.parcel WHERE gid=" + parcel.gid;
  var hullContruction = "ST_ConvexHull(ST_Buffer(" + parcelGeomQuery + ", BUFFER_OFFSET))";
  //var insertQuery = "INSERT"
  return pg('owned_parcel')
  .insert({
    land_owner_id: land_owner_id,
    parcel_gid: parcel.gid,

    // knex.raw('count(*) as user_count, status')
    // //SELECT lot_geom FROM parcel WHERE 
    // .whereRaw("ST_Intersects(ST_GeographyFromText('SRID=4326;POINT("+longitude+" "+latitude+")'), lot_geom)");
    // hull_geom: ST_ConvexHull(ST_Buffer(parcel.lot_geom, BUFFER_OFFSET)),
    // restriction_height: restriction_height || 0
  });
}

/**
* input:  gid (INTEGER)
* output: knex query removes row in owned_parcel table specified by gid
*/
var removeParcelOwnership = function(gid){
  return pg('owned_parcel')
  .where('gid')
  .delete();
}

/* Sample query to insert to owned_parcel table */
// getParcelGeometryText(77677)
// .then(function(r){
//   return convertToConvexHullRaw(r[0].lot_geom)
// })
// .then(function(r){
//   return addOwnedParcel(1, 77676, r.rows[0].st_setsrid, '10:00:00', '10:00:00')
//   .then(function(result){
//     console.log(result);
//   })
//   .catch(function(error){
//     console.log('inside')
//     console.log(error)
//     return error;
//   });
// })
// .catch(function(error){
//   return error;
// })


//*************************************************************************
//        DRONE SPECIFIC
//*************************************************************************

/**
* input:  drone type
*         max velocity
* output: knex query that inserts a row to drone table
*/
var addDrone = function(type, max_vel) {
  return pg('drone')
  .insert({
    drone_type: type,
    max_velocity: max_vel
  });
}

/**
* input:  id
* output: knex query that removes a row in the drone table
*/
var removeDrone = function(id) {
  return pg('drone')
  .where('id',id)
  .delete();
}

// var getDrone = function(where_obj) {
//   return pg.select('*')
//   .from('drone')
//   .where(where_obj);
// }

/**
* input:  operator_name   (VARCHAR)
* output: knex query that inserts a drone operator into the drone_operator table
*/
var addDroneOperator = function(operator_name) {
  return pg('drone_operator')
  .insert({
    operator_name: operator_name
  });
}

/**
* input:  id
* output: knex query that removes a row in the drone_operator table
*/
var removeDroneOperator = function(id){
  return pg('drone_operator')
  .where('id',id)
  .delete();
}


/**
* input:  drone_id,  the id of the associated drone
          drone_operator_id, the id of the associated operator
          flight_start, the ISO string for the start date of the flight
          flight_end, the ISO string for th end date for the flight
          linestring_wgs84 the GeoJSON string for the proposed geometry.
* output: knex query that removes a row in the drone_operator table
*/
var addFlightPath = function(drone_id, drone_operator_id, flight_start, flight_end, linestring_wgs84) {
  var insertLine = 'INSERT INTO flight_path (drone_id, drone_operator_id, flight_start, flight_end, path_geom)';
  var linestringValue = 'ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(' + linestring_wgs84 + '),4326),102243)';
  var valuesLine = 'VALUES (' + drone_id + ',' + drone_operator_id + ',' + flight_start + ',' + flight_end + ',' + linestringValue +')';
  var rawQuery = insertLine + ' ' + valuesLine + ' ' + 'RETURNING gid;'

  // Create a buffered version of the polygon

  // test the buffered version of the polygon against the currently restricted parcels

    // if their is a restriction maybe return the restricted geometries?

    // if there is no restriction return the geometry?

  return pg.raw(rawQuery);
}


// var getFlightPath = function(where_obj) {
//   return pg.select('*')
//   .from('flight_path')
//   .where(where_obj);
// }

/**
* input:  object of key value pairs that indicate equalities that must be met.
* output: knex query that searches for geometries that meet 'where' requirements.
*         To get the geometry you must access the __obj__.rows[#].st_asgeojson
*         below is an example object:
*           { command: 'SELECT',
              rowCount: 1,
              oid: NaN,
              rows: [ { st_asgeojson: '{"type":"LineString","coordinates":[[102,0.000000000000013],[103,0.999999999986567],[104,0.000000000000013],[105,0.999999999986567]]}' } ],
              fields: 
                [ { name: 'st_asgeojson',
                    tableID: 0,
                    columnID: 0,
                    dataTypeID: 25,
                    dataTypeSize: -1,
                    dataTypeModifier: -1,
                    format: 'text' } ],
              _parsers: [ [Function] ],
              RowCtor: [Function],
              rowAsArray: false,
              _getTypeParser: [Function] 
            }
*/
var getFlighPathGeom = function(where_obj) {
  var selectLine = 'SELECT ST_AsGeoJSON(ST_Transform(path_geom, 4326))';
  var fromLine = 'FROM flight_path';
  var whereLine = _whereCreation(where_obj);
  var rawQuery = selectLine + ' ' + fromLine + ' ' + whereLine + ';';
  return pg.raw(rawQuery);
}

// var getDroneFlightPath = function(where_obj) {
// }

// var getOperatorFlightPath = function(where_obj) {
// }

// var getFlightPathArea = function(where_obj) {
//}







//*************************************************************************
//        HELPERS
//*************************************************************************

var _whereCreation = function(where_obj) {
  var whereLine = 'WHERE';
  var firstWhereStatement = false;
  for (key in where_obj) {
    if (!firstWhereStatement) {
      firstWhereStatement = true;
    } else {
      whereLine += 'AND';
    }
    whereLine += ' ';
    whereLine += key;
    whereLine += '=';
    whereLine += where_obj[key];
  }

  return whereLine;
}


module.exports = {
  // General
  getParcelGeometryJSON:    getParcelGeometryJSON,
  getParcelGeometryText:    getParcelGeometryText,
  convertToConvexHullRaw:   convertToConvexHullRaw,
  convertToConvexHullText:  convertToConvexHullText,
  getParcelGid:             getParcelGid,
  // Client
  getRestricted:      getRestricted, 
  setRestriction:     setRestriction,
  addLandOwner:       addLandOwner,
  removeLandOwner:    removeLandOwner,
  addParcelOwnership: addParcelOwnership,
  // Drone
  addDrone:           addDrone,
  removeDrone:        removeDrone,
  addDroneOperator:   addDroneOperator,
  removeDroneOperator:removeDroneOperator,
  addFlightPath:      addFlightPath,
  //getFlightPath:      getFlightPath,
  getFlighPathGeom:   getFlighPathGeom
}
