var cointhink = require('cointhink')

cointhink.log('test.js starting')
cointhink.ready(function(storage){
  console.log('cointhink ready returned '+JSON.stringify(storage))
  if(!storage.valx){console.log("valx is empty setting to 0."); storage.valx = 0}
  old_valx = storage.valx
  storage.valx = storage.valx + 1
  console.log('valx += 1. new storage is '+JSON.stringify(storage))
  cointhink.db.store(storage, function(){
    console.log('storage saved. using get on valx')
    cointhink.db.get('valx', function(valx){
      if(valx != old_valx+1){console.log("***!!! FAIL "+old_valx+" != "+valx)}
      console.log('read valx is '+valx+'. adding one')
      valx += 1
      console.log('storing local valx of '+valx)
      cointhink.db.set('valx', valx, function(){
        console.log('second reading valx')
        cointhink.db.get('valx', function(svalx){
          if(valx != old_valx+2){
            console.log("***!!! FAIL "+old_valx+" != "+valx)
          } else {
            console.log('third read svalx is '+svalx+' while local valx '+valx+' storage valx = '+storage.valx)
          }
        })
      })
    })
  })
})
