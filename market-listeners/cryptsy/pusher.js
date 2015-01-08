var Pusher = require('pusher-client')

console.log('about to connect')
var push = new Pusher("cb65d0a7a72cd94adf1f", {encrypted: true})
console.log('about to subscribe')
var chan = push.subscribe('ticker.3')
console.log('about to bindall')
push.bind_all(function(e){
  console.log(e)
})

