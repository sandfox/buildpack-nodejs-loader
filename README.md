# shimmy-wimmy

a shim to fit between things

_HERE LIES DRAGONS_

This is some stuff that is used for bootstrapping some wierd nodejs applications inside an AWS enviroment.

## Why?

The code/scripts here provide a shim of sorts to allow the artifact to run using it's own bundled binaries
and maybe in the future some basic isolation, without needing changes on the infrastructure.

## Usage

Expects the CWD to be the root of the application!

```js
require('shimmy-wimmy')(absolutePathToModule)
```
