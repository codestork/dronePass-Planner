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
  var query = pg.select(st.asGeoJSON('lot_geom'))
  .from(table || 'parcel')
  return gid.constructor === Array ? query.whereIn('gid', gid) : query.where('gid', gid);
};

/**
* input: gid, table
* output: knex query that selects Text Geometry of provided gid in provided table
*/
var getParcelGeometryText = function(gid, table){
  var query = pg.select(st.asText('lot_geom'))
  .from(table || 'parcel')
  return gid.constructor === Array ? query.whereIn('gid', gid) : query.where('gid', gid);
};

/**
* input: Geometry as Text
* output: knex query that gives Convex Hull as Raw Geometry
*/
var convertToConvexHull = function(geoText){
  return pg.raw("SELECT ST_SetSRID(ST_ConvexHull(ST_GeomFromText('"+geoText+"')), 102243)")
  .then(function(r){
    return r.rows[0].st_setsrid;
  });
};

/**
* input: Geometry as Text
* output: promise with geometry set to specified srid
*/
var setSRID = function(geometry, srid){
  return pg.raw("SELECT ST_SetSRID(ST_GeomFromText('"+geometry+"'),"+srid+")")
  .then(function(result){
    return result.rows[0].st_setsrid;
  });
};

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
};

/**
* input: long, lat
* output: knex query that selects gid of Parcel that intersects with provided long lat point
*         by geometry calculations (fast, estimate)
*/
var getParcelGid = function(longitude, latitude){
  return pg.select('gid')
  .from('parcel')
  .whereRaw("ST_Contains(lot_geom, ST_Transform(ST_GeometryFromText('POINT("+longitude+" "+latitude+")',4326), 102243))");
};

/**
* input:  polygon       (as Text or Geometry)
*         buffer length (FLOAT)
* output: promise with a buffered polygon (as Text)
*/
var bufferPolygon = function(polygon, bufferSize){
  return pg.raw("SELECT ST_AsText(ST_Buffer('"+polygon+"',"+bufferSize+", 'join=mitre mitre_limit=5.0'))")
  .then(function(result){
    return result.rows[0].st_astext;
  });
};


//*************************************************************************
//        CLIENT SPECIFIC
//*************************************************************************

/**
* input: parcel, start_time, duration
* output:
*/
var setRestriction = function(parcel_gid, start_time, end_time){
  return pg('owned_parcel')
  .where({
    'parcel_gid' : parcel_gid
  })
  .update({
    restriction_start: start_time,
    restriction_end: end_time
  }, ['gid','land_owner_id','parcel_gid','restriction_start','restriction_end']);
};

var getRestriction = function(where_obj) {
  return pg.select(['restriction_start', 'restriction_end'])
  .from('owned_parcel')
  .where(where_obj);
};

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
};

/**
* input:  id  (INTEGER)
* output: knex query removes row in land_owner table with given id
*/
var removeLandOwner = function(id){
  return pg('land_owner')
  .where('id',id)
  .delete();
};

/**
* input:  land_owner_id (INTEGER)
          parcel_gid    (INTEGER)
          geom          (POLYGON GEOMETRY)
          start         (TIME)
          end           (TIME)
* output: knex query inserts row in owned_parcel table 
*         and returns the entry made (minus convex hull)
*/
var addParcelOwnership = function(land_owner_id, parcel_gid, geom, start, end){
  return pg('owned_parcel').insert({
    land_owner_id: land_owner_id,
    parcel_gid: parcel_gid,
    hull_geom: geom,
    restriction_height: 0,
    restriction_start: start,
    restriction_end: end
  }, ['gid', 'land_owner_id', 'parcel_gid', 'restriction_height', 'restriction_start', 'restriction_end']);
};

/**
* input:  gid (INTEGER)
* output: knex query removes row in owned_parcel table specified by gid
*/
var removeParcelOwnership = function(gid){
  return pg('owned_parcel')
  .where('gid', gid)
  .delete();
};

/**
* input:  drone_id           (INTEGER)
*         owned_parcel_gid   (INTEGER)
*         exemption_start    (TIMESTAMP)
*         exemption_end      (TIMESTAMP)
* output: knex query adds row in restriction_exemption table
*/
var addRestrictionExemption = function(call_sign, owned_parcel_gid, exemption_start, exemption_end){
  return pg('restriction_exemption')
  .insert({
    call_sign: call_sign,
    owned_parcel_gid: owned_parcel_gid,
    exemption_start: exemption_start,
    exemption_end: exemption_end
  }, ['id', 'drone_id', 'owned_parcel_gid', 'exemption_start', 'exemption_end']);
};

/**
* input: id (INTEGER)
* output: knex query removes row in restriction_exemption table specified by id
*/
var removeRestrictionExemption = function(id){
  return pg('restriction_exemption')
  .where('id', id)
  .delete();
};


//*************************************************************************
//        DRONE SPECIFIC
//*************************************************************************

/**
* input:  call sign
*         drone type
*         max velocity
* output: knex query that inserts a row to drone table
*/
var addDrone = function(callSign, droneType, maxVelocity) {
  return pg('drone')
  .insert({
    call_sign: callSign,
    drone_type: droneType,
    max_velocity: maxVelocity
  }, ['id', 'call_sign', 'drone_type', 'max_velocity']);
};

/**
* input:  call sign
* output: knex query that removes a row in the drone table
*/
var removeDrone = function(callSign) {
  return pg('drone')
  .where('call_sign',callSign)
  .delete();
};

/**
* input:  operator_name   (VARCHAR)
* output: knex query that inserts a drone operator into the drone_operator table
*/
var addDroneOperator = function(operator_name) {
  return pg('drone_operator')
  .insert({
    operator_name: operator_name
  });
};

/**
* input:  id
* output: knex query that removes a row in the drone_operator table
*/
var removeDroneOperator = function(id){
  return pg('drone_operator')
  .where('id',id)
  .delete();
};

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
};


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
};


module.exports = {
  // General
  getParcelGeometryJSON:      getParcelGeometryJSON,
  getParcelGeometryText:      getParcelGeometryText,
  getParcelGidByGeography:    getParcelGidByGeography, 
  convertToConvexHull:        convertToConvexHull,
  getParcelGid:               getParcelGid,
  setSRID:                    setSRID,
  bufferPolygon:              bufferPolygon,
  // Client
  getRestriction:             getRestriction, 
  setRestriction:             setRestriction,
  addLandOwner:               addLandOwner,
  removeLandOwner:            removeLandOwner,
  addParcelOwnership:         addParcelOwnership,
  removeParcelOwnership:      removeParcelOwnership,
  addRestrictionExemption:    addRestrictionExemption,
  removeRestrictionExemption: removeRestrictionExemption,
  // Drone
  addDrone:           addDrone,
  removeDrone:        removeDrone,
  addDroneOperator:   addDroneOperator,
  removeDroneOperator:removeDroneOperator,
  //getFlightPath:      getFlightPath,
  getFlighPathGeom:   getFlighPathGeom
}
