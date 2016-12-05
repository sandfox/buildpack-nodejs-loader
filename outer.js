'use strict'

/**
 * Outer shim:
 * system provided nodejs will run this file which in 
 * turn will run the app using the bundled nodejs
 */

const childProcess = require('child_process')
const path = require('path')
const fs = require('fs')

module.exports = function(targetFilePath){

  console.log('[outer shim] outer shim is starting')
  // run profile script to extract binary locations
  const o = childProcess.spawnSync(path.join(__dirname, 'find_node.sh'), {encoding: 'utf8'})

  if(o.error){
    throw o.error
  }

  // path to node binary should be here :-)
  const nodeBinaryPath = o.stdout.trim()

  console.log(`[outer shim] using binary at ${nodeBinaryPath}`)

  // run the inner shim via fork so we can establish an IPC
  const appProcess = childProcess.fork(path.join(__dirname, 'inner.js'), {
    execPath: nodeBinaryPath,
    stdio: 'inherit',
    env: process.env
  })

  /**
   * Send the abs path of the module the shim should load up
   */
  appProcess.send({module: targetFilePath})

  /**
   * keep-alive messages sent to child
   */
  const heartbeat = setInterval(()=>{
    appProcess.send({type: 'heartbeat'})
  }, 1000)

  heartbeat.unref()

  /**
   * Attach child process listeners
   */
  appProcess.on('error', (err)=> {
    clearInterval(heartbeat)
    console.log(`[outer shim] Failed to spawn inner shim: ${err}`)
    process.exit(1)
  })

  appProcess.on('exit', (code, signal)=> {
    clearInterval(heartbeat)
    console.log(`[outer shim] inner shim process has exited: code ${code}, signal ${signal}`)
    process.exit(code)
  })

  appProcess.on('close', ()=> {
    clearInterval(heartbeat)
    console.log(`[outer shim] inner shim process has closed`)
  })

  console.log('[outer shim] outer shim has started')
}