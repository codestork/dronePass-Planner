var utils = require('./db/utils');

module.exports = {
  'test1': {
    get: function(req, res){
      console.log('GETTING THE STUFF')
      res.status(200).send('hello world');
    },
    post: function(req, res){
      res.status(200).send('whut');
    }
  },


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
  'removeUser/:user_id': {
    delete: function(req, res){
      utils.removeLandOwner(req.user_id)
      .then(function(deleted){
        if (deleted) res.status(200).send('Removed user '+req.user_id+' from land_owner table');
        else res.status(400).send('No user with id# '+req.user_id+' to delete');
      })
      .catch(function(error){
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
        console.log('coordinates received...');
        console.log(rb.coordinates[0]);
        console.log(rb.coordinates[1]);
      } else {
        console.log('coordinates missing');
      }
      // Get gid of parcel that contains given coordinates
      utils.getParcelGid(rb.coordinates[0], rb.coordinates[1])
      .then(function(result){
        console.log('found parcel gid', result[0].gid);
        return parcel_gid = result[0].gid;
      })
      // Get geometry of that parcel and compute convex hull of it
      .then(utils.getParcelGeometryText)
      .then(function(result){
        return utils.convertToConvexHull(result[0].lot_geom);
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
        console.log(error);
        res.status(400).send(error);
      });
    }
  },


  /**
  * expects delete method
  * expects gid (INTEGER)
  *
  * invokes removeParcelOwnership to delete row in owned_parcel matching given gid
  */
  'removeAddress/:gid': {
    delete: function(req, res){
      utils.removeParcelOwnership(req.gid)
      .then(function(deleted){
        if (deleted) res.status(200).send('Deleted owned_parcel row where gid='+req.gid);
        else res.status(400).send('Row with gid='+req.gid+' does not exist in owned_parcel. Deleted nothing');
      })
      .catch(function(error){
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
      .then(function(updated_entry){
        res.status(200).send(updated_entry);
      })
      .catch(function(error){
        res.status(400).send(error);
      });
    }
  },

  'setException': {
    get: function(req, res){
    }
  },

  'removeException': {
    post: function(req, res){

    }
  }

}