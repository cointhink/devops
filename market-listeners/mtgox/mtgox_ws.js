var base = require('./base')
base.zk_services(function(services){
  var zmq = require('zmq'),
      sock = zmq.socket('pub')

  var websocket = require('websocket')

  // zmq setup
  sock.bindSync('tcp://'+services.mtgox_ws.host);
  console.log('zeromq PUSH bound to '+services.mtgox_ws.host);

  // riemann setup
  var riemann = require('riemann').createClient({ host: services.riemann.hostname,
                                                  port: services.riemann.port })
  console.log('riemann configured with '+services.riemann.host)
  var use_riemann = false
  riemann.tcp.socket.on('error', function(e){ console.warn("Riemann TCP error: "+e.message)})
  riemann.tcp.socket.on('connect', function(){ use_riemann = true; console.log("riemann connected")})

  // redis setup
  var redis = require('redis').createClient(services.redis.port, services.redis.hostname)
  console.log('redis configured with '+services.redis.host)
  redis.on('connect', function(){
    console.log("redis connected!")
    // websocket setup
    var WebSocketClient = require('websocket').client;
    var ws = new WebSocketClient();

    ws.on('connectFailed', function(error) {
        console.log('Connect Error: ' + error.toString());
    });

    var old_message_count, message_count = 0;
    var old_message_date = new Date();

    ws.on('connect', function(connection) {
        console.log('mtgox websocket connected!');
        connection.on('error', function(error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function() {
            console.log('echo-protocol Connection Closed');
        });
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
              packet = JSON.parse(message.utf8Data)
              console.log(packet.ticker.last)
              message_count += 1
              var ticker = packet["ticker"]
              zmq_send(ticker, "C")
              redis_ticker(ticker)
            }
        });
    })

    setInterval(function(){
      riemann_send(message_count)
      if(old_message_count == message_count){
        var stable_time = ((new Date()) - old_message_date)/1000
        if(stable_time > 120) {
          console.log('mps rate has been at '+message_count+' for '+stable_time+' seconds!')
          process.exit(1)
        }
      } else {
        console.log((new Date())+' messages per second '+message_count)
        old_message_count = message_count
        old_message_date = new Date()
      }
      message_count = 0
    }, 1000)

    function zmq_send(packet, channel){
      if(typeof(packet) != 'object') {console.err('bad input to zmq_send')}
      var data = JSON.stringify(packet)
      if(typeof(channel) == 'string') { data = channel + data }
      sock.send(data)
    }

    function redis_ticker(ticker){
      var hash_name = 'mtgox-ticker-'+ticker.item+ticker.last.currency
      console.log('set '+hash_name+' ')
      redis.hset(hash_name, 'value', ticker.last.value)
      redis.hset(hash_name, 'now', (new Date(ticker.now/1000)).toISOString())
    }

    function riemann_send(count) {
      if(use_riemann){
        riemann.send(riemann.Event({
          service: 'mtgox',
          metric: count
        }))
      }
    }

    // websocket loop
    ws.connect('ws://websocket.mtgox.com:80/?Channel=ticker.BTCUSD', null,  "http://websocket.mtgox.com");
  })
})


