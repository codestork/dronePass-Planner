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
  * invokes addLandOwner to insert row to land_owner table
  */
  'registerUser': {
    post: function(req, res){
      rb = req.body;
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
  * invokes removeLandOwner to delete row where id == user_id
  */
  'removeUser': {
    delete: function(req, res){
      rb = req.body;
      utils.removeLandOwner(rb.user_id)
      .then(function(removed_entry){
        res.status(200).send(removed_entry.toString());
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
  * Finds the gid of given coordinates
  * Creates Hull Geometry of found gid's geometry
  * Inserts row into owned_parcel with given & found information
  */
  'registerAddress': {
    post: function(req, res){
      rb = req.body;
      var parcel_gid, geom;
      if (rb.coordinates) {
        console.log('coordinates received...');
        console.log(rb.coordinates[0]);
        console.log(rb.coordinates[1]);
      } else {
        console.log('coordinates missing');
      }
      utils.getParcelGid(rb.coordinates[0], rb.coordinates[1])
      .then(function(result){
        console.log('found parcel gid', result[0].gid);
        return parcel_gid = result[0].gid;
      })
      .then(utils.getParcelGeometryText)
      .then(function(result){
        return utils.convertToConvexHull(result[0].lot_geom);
      })
      .then(function(geom){
        return utils.addParcelOwnership(rb.user_id, parcel_gid, geom, rb.restriction_start_time, rb.restriction_end_time);
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
  * invokes removeParcelOwnership to delete row in owned_parcel matching given gid
  */
  'removeAddress': {
    delete: function(req, res){
      rb = req.body;
      utils.removeParcelOwnership(rb.gid)
      .then(function(deleted){
        if (deleted) res.status(200).send('Deleted owned_parcel row where gid='+rb.gid);
        else res.status(400).send('Row with gid='+rb.gid+' does not exist in owned_parcel. Deleted nothing');
      })
      .catch(function(error){
        res.status(400).send(error);
      })
    }
  },

  'togglePermissions': {
    post: function(req, res){

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