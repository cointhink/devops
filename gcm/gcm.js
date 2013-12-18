var fs=require('fs')
var express = require('express');
var request = require('request');
var app = express();
var clients={} 

var config = JSON.parse(fs.readFileSync('config.json'))

function gcm_push(o){
  var ids = Object.keys(clients)
  if(ids.length == 0) { console.log('skipping push. 0 clients'); return }
  var payload = {
       "registration_ids" : ids,
       "data" : o }
  console.log("GCM Push: "+JSON.stringify(payload))
  request.post({url: "https://android.googleapis.com/gcm/send",
                headers: { "Authorization":"key="+ config.key,
                           "Content-Type":"application/json"},
                json: payload
               }, function(err,resp,body){
                 console.log(body)
                 for(var i=0,len=body.results.length; i<len; i++){
                   var result = body.results[i]
                   if(result.error){
                     console.log(result.error+". Removing "+ids[i])
                     delete clients[ids[i]]
                     console.dir(clients)
                   }
                 }
               })
}

app.use(express.bodyParser());

app.post('/register', function(req, res){
  console.log('POST'+JSON.stringify(req.body))
  clients[req.body.registration_id] = {}
  var body = '{"status":"OK"}';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', body.length);
  res.end(body);
  
  gcm_push({"date": (new Date()).toISOString(),
            "sender":"node.js", 
            "message":"hello world"})
});

app.listen(2408);
console.log('Listening on port 2408');

