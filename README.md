# buildpack-nodejs-loader

_used to called shimmy-wimmy, but some people didn't like that name_

Intended for use in an application that has been compiled/built by a [buildpack](https://devcenter.heroku.com/articles/buildpack-api). It allows the application to transparently run using a bundled nodejs binary in preference to any system supplied nodejs binary.

Primarily of use for when you don't have alot of control over the enviroment you are running in.



## Usage

```js
require('buildpack-nodejs-loader')(absolutePathToSomeModule)
```


For this module to able to find buildpack binaries it expects the $CWD of the process it's running in to be the root of the application, for most people this will always be the case.

Where you originally an applications index.js might have looked like this:

```js
require('lib/app')
```

it should now become this:

```js
const path = require('path')
require('buildpack-nodejs-loader')(path.join(__dirname, 'lib', 'app'))
```

---------

or if you application was run using 

```js
$ node app.js
```

where app.js contained your applications bootstrap / main function, it's probably easier to add
a new file alongside it and run that instead. e.g

```js
const path = require('path')
require('buildpack-nodejs-loader')(path.join(__dirname, 'app'))
```


## How it works:

Here is a brief description of whats happening, although I'd recommend reading the code.

When the module is run, it executes some bash scripts to load any `.profile.d` scripts created by buildpacks, and finds the path to the nodejs binary in the artifact, if none is found it will fall back to any system supplied nodejs binary. 
Using the found nodejs binary it uses `child_process.fork` creates a child process that new binary, and then passes it a message saying what module to require. It also sets up some heartbeat checks so that if the parent is terminated under strange circumstances the child process will exit after 3 seconds of being orphaned. 