var cointhink = require('cointhink')

cointhink.log('test.js starting')
cointhink.ready(function(storage){

  cointhink.trade('mtgox','btc',1,'sell','usd',110, function(result, err){
    console.log('sell result '+JSON.stringify(result))
  })
  cointhink.trade('mtgox','btc',0.01,'buy','usd',90, function(result, err){
    console.log('buy result '+JSON.stringify(result))
  })

  cointhink.exchange('mtgox',function(ticker){console.dir(ticker)})

})
