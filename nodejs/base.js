module.exports = new (function(){
  var url = require('url')
  var async = require('async')
  var ZK = require('zkjs')
  var zk = new ZK({root: '/cointhink'})

  this.zk_services = function(cb){
    zk.start(function(err){
      if(err){
        console.log("zookeeper connect FAIL "+err)
        process.exit()
      } else {
        gather_services(cb)
      }
    })
  }


  function gather_services(cb){
    zk.getChildren('/services', function(err, services, zstat){
      async.map(services, function(service, cb){
        zk.get('/services/'+service, function(err, value){
          if(value) { value = value.toString() }
          cb(err, value)
        })
      }, function(err, results){
        services_info = {}
        for(var i=0, len=services.length; i < len; i++){
          services_info[services[i]] = url.parse(results[i])
        }
        cb(services_info)
      })
    })
  }

})