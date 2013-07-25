var base = require('./base')
base.zk_services(function(services){

  var zmq = require('zmq'),
      pub_sock = zmq.socket('pub'),
      sub_sock = zmq.socket('sub')
  var r = require('rethinkdb')
  var redis = require('redis').createClient(services.redis.port, services.redis.hostname)
  console.log('redis configured with '+services.redis.host)


  r.connect({host:services.rethinkdb.hostname,
             port:services.rethinkdb.port,
             db:services.rethinkdb.path.substr(1)}, function(err, conn) {
    console.log('rethinkdb configured with '+services.rethinkdb.format())
    var storage_tablename = 'storage'

    conn.addListener('error', function(e) {
      console.log("rethinkdb error: "+e)
    })

    conn.addListener('close', function() {
      console.log("rethinkdb closed")
    })

    redis.on("error", function (err) {
          console.log("Redis Error " + err);
    })

    sub_sock.on('message', function(data){
      var channel = "C"
      data = data.toString().substring(channel.length)
      console.log("SUB: "+data)
      try {
        var message = JSON.parse(data)
        if(message.action == "ping") { console.log("pong"); respond(message.id, {action:"pong"}); return }
        var payload = message.payload
        var fullname = message.username+"/"+message.scriptname

        console.log("rethink load called on "+fullname)
        r.table('scripts').get(fullname).run(conn, function(err, doc){
          if(err){
            console.log('rethink load error: '+err)
            respond(message.id,{"status":"dberr"})
          } else {
            console.log(fullname+' rethink doc loaded')
            if(doc){
              if(doc.key == message.key){
                switch(payload.action) {
                  case 'get':
                    do_get(payload, function(response){
                      respond(message.id, response)
                    })
                    break
                  case 'set':
                    do_set(payload, function(response){
                      respond(message.id, response)
                    })
                    break
                  case 'load':
                    do_load(payload, function(response){
                      respond(message.id, response)
                    })
                    break
                  case 'store':
                    console.log(fullname+' store storage '+JSON.stringify(payload.storage))
                    if(typeof(payload.storage) == 'object'){
                      do_store(payload, function(response){
                        respond(message.id, response)
                      })
                    } else {
                      respond(message.id,{"status":"err", "msg":"storage must be an object"})
                    }
                    break
                  case 'trade':
                    do_trade(payload, function(response){
                      respond(message.id, response)
                    })
                    break
                  default:
                    respond(message.id,{"status":"err", "msg":"unknown action "+payload.action})
                }
              } else {
                console.log(fullname+" bad key!")
                respond(message.id,{"status":"badkey"})
              }

              function do_get(payload, cb){
                r.table(storage_tablename).get(fullname)(payload.key).run(conn, function(err, value){
                  console.log(fullname+' get '+payload.key+' '+value)
                  cb({"status":"ok", "payload":value})
                })
              }

              function do_set(payload, cb){
                console.log(fullname+' set '+payload.key+' = '+payload.value)
                var update_hash = {}
                if(payload.key != "_cointhink_key_"){
                  update_hash[payload.key] = payload.value
                }
                r.table(storage_tablename).get(fullname).
                  update(update_hash, {return_vals:true}).
                  run(conn, function(status){
                    console.log(fullname+' set '+payload.key+' '+payload.value+' = '+status)
                    cb({"status":"ok", "payload":status})
                })
              }

              function do_load(payload, cb){
                r.table(storage_tablename).get(fullname).run(conn, function(err, storage){
                  delete storage['_cointhink_id_']
                  console.log(fullname+' load storage callback returned: '+JSON.stringify(storage))
                  cb({"status":"ok", "payload":storage})
                })
              }

              function do_store(payload, cb){
                delete payload.storage['_cointhink_id_']
                r.table(storage_tablename).get(fullname).
                  update(payload.storage, {return_vals:true}).
                  run(conn, function(status){
                    console.log(fullname+' store storage result '+status)
                    cb({"status":"ok", "payload":status})
                })
              }

              function do_trade(payload, cb){
                console.log(fullname+' trade '+payload.exchange+' '+payload.market+' '+payload.buysell)
                var hashname = payload.exchange.toLowerCase()+"-ticker-"+
                               payload.market.toUpperCase()+
                               payload.currency.toUpperCase()
                redis.hgetall(hashname, function(err,ticker){
                  console.log('redis return '+JSON.stringify(ticker))
                  var response = trade(payload, doc.inventory, ticker)
                  if(response.status == 'ok'){
                    console.log("prepending trades with "+JSON.stringify(response.payload.trade))
                    r.table('scripts').get(fullname)('trades').
                    prepend(response.payload.trade).run(conn, function(err, trades){
                      console.log('prepend trades done. size '+trades.length)
                      if(err) { console.log('rethink prepend error: '+err) }
                      console.log('updating inventory with '+JSON.stringify(doc.inventory))
                      r.table(storage_tablename).get(fullname).
                      update({inventory:doc.inventory}).run(conn, function(err, result){
                        console.log('update inventory done '+JSON.stringify(result))
                        if(err) { console.log('rethink update inventory error: '+err) }
                        var trade_msg = "["+payload.exchange+"] "+payload.buysell+" "+payload.quantity+payload.market+"@"+payload.amount+payload.currency
                        r.table('signals').insert({name:fullname,
                                                   time:(new Date()).toISOString(),
                                                   type:payload.action,
                                                   msg:trade_msg}).run(conn, function(err){if(err)console.log(err)})
                        cb(response)
                      })
                    })
                  } else {
                    cb(response)
                  }
                })
              }

            } else {
              console.log(fullname+" empty doc!")
              respond(message.id,{"status":"nodoc"})
            }
          }

        })
      } catch (ex) {
        console.log(ex+' bad JSON "'+data+'"')
        respond(message.id,{"status":"garbled"})
      }

    })

    var pub_url = services.storage_relay_pub.format()
    pub_sock.bindSync(pub_url);
    console.log('storage relay pub '+pub_url)
    var sub_url = services.storage_relay_sub.format()
    sub_sock.bindSync(sub_url);
    sub_sock.subscribe('C')
    console.log('storage relay sub '+sub_url)

    function respond(id, payload){
      payload.id = id
      var data = JSON.stringify(payload)
      console.log('PUB: '+data)
      var channel = 'C'
      pub_sock.send(channel+data)
    }

    //trade('mtgox','btc',4,'buy','usd',92)
    //trade('mtgox','btc',4,'sell','usd',97)
    //payload: exchange, market, quantity, buysell, currency, amount, cb
    function trade(payload, inventory, ticker){
      var result // return value
      var ticker_age_sec = ((new Date()) - new Date(ticker.now))/1000
      if(ticker_age_sec < 120){
        var price_diff_ratio = (Math.abs(payload.amount - ticker.value))/ticker.value
        if(price_diff_ratio <= 0.01){
          if(payload.buysell == 'buy') {
            var on_hand = inventory[payload.currency]
            if(on_hand){
              var price = (payload.amount * payload.quantity)
              if(on_hand >= price) {
                  inventory[payload.currency] -= price
                  inventory[payload.market] += payload.quantity
                  result = {"status":"ok", payload: {trade:payload, inventory:inventory}}
              } else {
                result = {"status":"err", payload:""+on_hand+payload.currency+" is in sufficient for "+price}
              }
            } else {
              result = {"status":"err", payload:"no "+payload.currency+" in inventory"}
            }
          } else if (payload.buysell == 'sell') {
            var on_hand = inventory[payload.market]
            if(on_hand){
              if(on_hand >= payload.quantity){
                inventory[payload.market] -= payload.quantity
                if(typeof(inventory[payload.currency]) == "undefined") {  inventory[payload.currency] = 0}
                inventory[payload.currency] += (payload.quantity * payload.amount)
                result = {"status":"ok", payload: {trade:payload, inventory:inventory}}
              } else {
                result = {"status":"err", payload:""+on_hand+payload.market+" is in sufficient for "+payload.quantity}
              }
            } else {
              result = {"status":"err", payload:"no "+payload.market+" in inventory"}
            }
          }
        } else {
          result = {"status":"err", payload:"price of "+payload.amount+" is more than 1% away from exchange "+payload.exchange+" price "+ticker.value}
        }
      } else {
        result = {"status":"err", payload:"exchange "+payload.exchange+" price too old ("+ticker_age_sec+" secs). please try again."}
      }

      return result
    }

  })
})