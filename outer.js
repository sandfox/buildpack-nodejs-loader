'use strict'

/**
 * Outer shim:
 * system provided nodejs will run this file which in
 * turn will run the app using the bundled nodejs
 */

const childProcess = require('child_process')
const path = require('path')

module.exports = function (targetFilePath) {
  console.log(`[outer shim] outer shim running on nodejs ${process.version} binary ${process.execPath}'`)
  // run profile script to extract binary locations
  const o = childProcess.spawnSync(path.join(__dirname, 'find_node.sh'), {encoding: 'utf8'})

  if (o.error) {
    throw o.error
  }

  // path to node binary should be here :-)
  const nodeBinaryPath = o.stdout.trim()

  console.log(`[outer shim] found nodejs binary to use at ${nodeBinaryPath}`)

  // TODO: do a test spawn to check we can...

  const innerShimPath = path.join(__dirname, 'inner.js')

  console.log(`[outer shim] forking inner shim file at ${innerShimPath}`)
  // run the inner shim via fork so we can establish an IPC
  const appProcess = childProcess.fork(innerShimPath, {
    execPath: nodeBinaryPath,
    env: process.env,
    silent: true
  })

  appProcess.stdout.pipe(process.stdout)
  appProcess.stderr.pipe(process.stderr)
  process.stdin.pipe(appProcess.stdin)

  console.log(`[outer shim] inner shim PID is ${appProcess.pid}`)

  /**
   * Timer for checking if child spawned ok
   */
  const DEFAULT_PHONE_HOME_TIMEOUT = 3000
  let phonedHome = false
  setTimeout(() => {
    if (phonedHome === false) {
      console.log(`[outer shim] nothing heard from inner shim after ${DEFAULT_PHONE_HOME_TIMEOUT} ms`)
      console.log(`[outer shim] inner shim IPC connected: ${appProcess.connected}`)
    }
  }, DEFAULT_PHONE_HOME_TIMEOUT)

  /**
   * handling messages from child
   */
  appProcess.on('message', (message) => {
    if (typeof message === 'string' && message === 'started') {
      phonedHome = true
      console.log(`[outer shim] inner shim phoned home`)
    }

    if (typeof message === 'object' && message.type && message.type === 'process-state') {
      console.log(`[outer shim] inner shim info: nodejs ${message.state.version}`)
    }
  })

  /**
   * Send the abs path of the module the shim should load up
   */
  console.log(`[outer shim] requesting inner shim load "${targetFilePath}"`)
  appProcess.send({module: targetFilePath})

  /**
   * keep-alive messages sent to child
   */
  let backlogTrip = false
  const heartbeat = setInterval(() => {
    const backlogOk = appProcess.send({type: 'heartbeat'}, (err) => {
      if (err) {
        console.log(`[outer shim] error whilst sending heartbeat: ${err.name} ${err.message}`)
      }
    })

    if (backlogOk === false && backlogTrip === false) {
      backlogTrip = true
      console.log(`[outer shim] heartbeat message backlog has exceeded some arbitary threshold`)
    }

    if (backlogOk === true && backlogTrip === true) {
      backlogTrip = false
      console.log(`[outer shim] heartbeat message backlog has fallen below some arbitary threshold`)
    }
  }, 1000)

  heartbeat.unref()

  /**
   * Attach child process listeners
   */
  appProcess.on('error', (err) => {
    clearInterval(heartbeat)
    console.log(`[outer shim] Failed to spawn inner shim: ${err}`)
    process.exit(1)
  })

  appProcess.on('exit', (code, signal) => {
    clearInterval(heartbeat)
    console.log(`[outer shim] inner shim process has exited: code ${code}, signal ${signal}`)
    process.exit(code)
  })

  appProcess.on('close', () => {
    clearInterval(heartbeat)
    console.log(`[outer shim] inner shim process has closed`)
  })

  appProcess.on('disconnect', () => {
    clearInterval(heartbeat)
    console.log(`[outer shim] inner shim process has disconnected`)
  })

  console.log('[outer shim] outer shim has started')
}
