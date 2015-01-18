var utils = require('./db/utils');

module.exports = {

  /**
  * expects post method
  * expects user_id (INTEGER), login (STRING), and owner_authority (INTEGER)
  *
  * invokes addLandOwner to insert row to land_owner table
  */
  'registerUser': {
    post: function(req, res){
      var rb = req.body;
      utils.addLandOwner(rb.user_id, rb.login, rb.owner_authority)
      .then(function(result){
        res.status(200).send(result);
      })
      .catch(function(error){
        console.error("registerUser error:",error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects delete method
  * expects user_id (INTEGER)
  *
  * invokes removeLandOwner to delete row where id == user_id
  */
  'removeUser/:generic_id': {
    delete: function(req, res){
      utils.removeLandOwner(req.generic_id)
      .then(function(deleted){
        if (deleted) res.status(200).send('Removed user '+req.generic_id+' from land_owner table');
        else res.status(400).send('No user with id# '+req.generic_id+' to delete');
      })
      .catch(function(error){
        console.error("removeUser/"+req.generic_id+" error:", error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects post method
  * expects user_id                 (INTEGER)
  *         coordinates             (TUPLE)
  *         restriction_start_time  (TIME)
  *         restriction_end_time    (TIME)
  *
  * Finds the gid of given coordinates
  * Creates Hull Geometry of found gid's geometry
  * Inserts row into owned_parcel with given & found information
  */
  'registerAddress': {
    post: function(req, res){
      var rb = req.body;
      var parcel_gid, geom;
      if (rb.coordinates) {
        console.log("coordinates received...");
        console.log(rb.coordinates[0]);
        console.log(rb.coordinates[1]);
        // Get gid of parcel that contains given coordinates
        utils.getParcelGid(rb.coordinates[0], rb.coordinates[1])
        .then(function(result){
          console.log('found parcel gid', result[0].gid);
          return parcel_gid = result[0].gid;
        })
        // Get geometry of that parcel and compute convex hull of it
        .then(utils.getParcelGeometryText)
        .then(function(result){
          return utils.convertToConvexHull(result[0].lot_geom)
          .then(function(geom){
            return utils.bufferPolygon(geom, 5);
          })
          .then(function(geom){
            return utils.setSRID(geom, 102243);
          })
        })
        // All the data is ready. Now inserts row to owned_parcel
        .then(function(geom){
          return utils.addParcelOwnership(rb.user_id, parcel_gid, geom, rb.restriction_start_time, rb.restriction_end_time);
        })
        // Prepare response package
        .then(function(entry){
          return utils.getParcelGeometryJSON(entry[0].parcel_gid, 'parcel_wgs84')
          .then(function(lot_geom){
            entry[0].lot_geom = JSON.parse(lot_geom[0].lot_geom);
            return entry;
          });
        })
        .then(function(res_data){
          console.log(res_data);
          res.status(200).send(res_data);
        })
        .catch(function(error){
          console.error("registerAddress error:", error);
          res.status(400).send(error);
        });
      } else {
        console.error("coordinates missing");
        res.status(400).send("coordinates missing")
      }
    }
  },

  /**
  * expects delete method
  * expects gid (INTEGER)
  *
  * invokes removeParcelOwnership to delete row in owned_parcel matching given gid
  */
  'removeAddress/:generic_id': {
    delete: function(req, res){
      utils.removeParcelOwnership(req.generic_id)
      .then(function(deleted){
        if (deleted) res.status(200).send('Deleted owned_parcel row where gid='+req.generic_id);
        else res.status(400).send('Row with gid='+req.generic_id+' does not exist in owned_parcel. Deleted nothing');
      })
      .catch(function(error){
        console.error("removeAddress/"+req.generic_id+" error:",error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects post method
  * expects parcel_gid              (INTEGER)
  *         restriction_start_time  (TIME)
  *         restriction_end_time    (TIME)
  *
  * invokes setRestriction to update permission times for specified row (by parcel_gid)
  */
  'updatePermission': {
    post: function(req, res){
      var rb = req.body;
      utils.setRestriction(rb.parcel_gid, rb.restriction_start_time, rb.restriction_end_time)
      .then(function(updatedEntry){
        res.status(200).send(updatedEntry);
      })
      .catch(function(error){
        console.error("updatePermission error:",error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects post method
  * expects drone_id                (INTEGER)
  *         owned_parcel_gid        (INTEGER)
  *         restriction_start_time  (TIMESTAMP)
  *         restriction_end_time    (TIMESTAMP)
  *
  * invokes addRestrictionExemption to add a join between a drone and a parcel
  * with a restriction time interval
  */
  'setExemption': {
    post: function(req, res){
      var rb = req.body;
      utils.addRestrictionExemption(rb.drone_id, rb.owned_parcel_gid, rb.restriction_start_time, rb.restriction_end_time)
      .then(function(newEntry){
        res.status(200).send(newEntry);
      })
      .catch(function(error){
        console.error("setExemption error:", error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects delete method
  * expects id   (INTEGER)
  *
  * invokes removeRestrictionExemption to delete row in restriction_exemption table
  * where id matches
  */
  'removeExemption/:generic_id': {
    delete: function(req, res){
      utils.removeRestrictionExemption(req.generic_id)
      .then(function(deleted){
        if (deleted) res.status(200).send('Deleted restriction_exemption row where id='+req.generic_id);
        else res.status(400).send('No restriction_exemption row where id='+req.generic_id+'. Nothing deleted.');
      })
      .catch(function(error){
        console.error("removeExemption/"+req.generic_id+" error:", error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects post method
  * expects callSign    (VARCHAR)
  *         droneType   (VARCHAR)
  *         maxVelocity (INTEGER)
  *
  * Invokes addDrone to add row to Drone table
  * sends back new entry or error         
  */
  'registerDrone': {
    post: function(req, res){
      var rb = req.body;
      utils.addDrone(rb.callSign, rb.droneType, rb.maxVelocity)
      .then(function(newEntry){
        res.status(200).send(newEntry);
      })
      .catch(function(error){
        console.log("registerDrone error:", error);
        res.status(400).send(error);
      });
    }
  },

  /**
  * expects delete method
  * expects callSign (VARCHAR)
  *
  * Invokes removeDrone to delete row in Drone table
  * that matches callSign, returns how many rows deleted
  */
  'removeDrone/:generic_id': {
    delete: function(req, res){
      utils.removeDrone(req.generic_id)
      .then(function(deleted){
        if (deleted) res.status(200).send('Deleted drone '+req.generic_id);
        else res.status(400).send('Could not find drone '+req.generic_id+'. Nothing deleted');
      })
      .catch(function(error){
        console.error("removeDrone/"+req.generic_id+" error:", error);
        res.status(400).send(error);
      });
    }
  }
}
