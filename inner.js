'use strict'

/**
 * Inner shim:
 * Expected to launched by outer shim.
 * Monitors it's parent so it isn't left orphaned
 */

let loaded = false;

// expiry timer incase parent leaves us behind as an orphan
let expiryTimer = setTimeout(byebye, 5000)
expiryTimer.unref()

process.on('message', function(msg){

  if(msg.type && msg.type === 'heartbeat'){
    return resetExpiry()
  }

  // Actually load the application up!
  if(msg.module && loaded === false){
    loaded = true
    return require(msg.module)
  }

})

function resetExpiry(){
  clearTimeout(expiryTimer)
  expiryTimer = setTimeout(byebye, 3000)
  expiryTimer.unref()
}

function byebye(code){
  process.exit(code)
}