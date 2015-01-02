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

  'registerUser': {
    post: function(req, res){

    }
  },

  'removeUser': {
    delete: function(req, res){

    }
  },

  'registerAddress': {
    post: function(req, res){

    }
  },

  'removeAddress': {
    post: function(req, res){

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