'use strict'

/**
 * Inner shim:
 * Expected to launched by outer shim.
 * Monitors it's parent so it isn't left orphaned
 */

let loaded = false

let lastPulse = Date.now()

// expiry timer incase parent leaves us behind as an orphan
let pulseCheckInterval = setInterval(check, 1000)
pulseCheckInterval.unref()

process.on('message', function (msg) {
  if (msg.type && msg.type === 'heartbeat') {
    lastPulse = Date.now()
  }

  // Actually load the application up!
  if (msg.module && loaded === false) {
    loaded = true
    console.log(`[inner shim] loading ${msg.module}`)
    return require(msg.module)
  }
})

function check () {
  const now = Date.now()
  if (now - lastPulse > 5000) {
    console.log('[inner shim] no heartbeat recieved for 5 seconds - exiting')
    process.exit(1)
  }
}

/**
 * Phone home
 */
console.log(`[inner shim] phoning home`)
process.send('started')

/**
 * Tell parent about our view of the world
 */
process.send({
  type: 'process-state',
  state: {
    version: process.version
  }
})
