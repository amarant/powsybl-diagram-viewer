# powsybl-diagram-viewer

Typescript library to integrate a powsybl svg diagram in a javascript project. The library is built with the Vite bundler.
Node from v18+ is required to build with Vite.

Installation using npm:  
'npm install @powsybl/diagram-viewer'  

#### For developers

For development purpose, to install this library locally from an app, you should run these commands in the library project :
- npm install
- npm run build
- npm pack

Then in the app project :
- npm install {PATH_TO_LIBRARY}/powsybl-diagram-viewer-{LIBRARY_VERSION}.tgz

*Warning* : with Create React App, we realised the library was not updating correctly if you try to install the library multiple times.
To fix this, run this command from the app **after** running "npm install"
- rm -Rf node_modules/.cache

#### For integrators

If you want to deploy a new version of powsybl-diagram-viewer in the [NPM package registry](https://www.npmjs.com/package/@powsybl/powsybl-diagram-viewer),
you need to follow the steps below:

-   Update to the new version in [package.json](https://github.com/powsybl/powsybl-diagram-viewer/blob/main/package.json) (example `0.6.0`)
-   Update the package-lock.json: `npm install`
-   Commit the package.json and package-lock.json files, push to a branch, make a PR, have it reviewed and merged to main.
-   [Make a release](https://github.com/powsybl/powsybl-diagram-viewer/releases/new) on GitHub by creating a new tag on the last commit. On the release creation page:
  - In "Choose a tag": type the tag you want to create (ex.: v0.6.0) and select "create new tag"
  - In "Target": click on "recent commit" tab and select your release commit
  - Click on "Generate release note"
  - Click on "Publish release"
-   It will trigger a job that will publish the release on NPM

Notes :
* Check [license-checker-config.json](license-checker-config.json) for license white list and exclusion.
  If you need to update this list, please inform organization's owners.
* We need to exclude some packages for now :
    * `@mapbox/jsonlint-lines-primitives@2.0.2` is a special license
    * `cartocolor@4.0.2` is Creative Commons but not correctly described in the package
    * `rw@0.1.4` is BSD-3-Clause but not correctly described in the package
    
