# REACT-MAINTENANCE-PLANNER
[![Netlify Status](https://api.netlify.com/api/v1/badges/3169f575-1d8c-4b1d-a8b7-b229dea0f5ef/deploy-status)](https://app.netlify.com/sites/react-maintenance-planner/deploys)

React library used for planning maintenance.

The library is based on [react-calendar-timeline](https://github.com/namespace-ee/react-calendar-timeline). <br/>
Currently taken commit - [9fd0f57](https://github.com/kbss-cvut/react-calendar-timeline/commit/9fd0f57f905bbffdd520a60a28cf93323704e057). <br/>
The source code of the library is located in folder **src/components/timeline**.

## Live demo
Check out [live demo using storybook](https://react-maintenance-planner.netlify.app/).

## Run storybook locally
```sh
$ git clone git@github.com:kbss-cvut/react-maintenance-planner.git
$ cd react-maintenance-planner
$ npm install
$ npm run dev
```

## Available scripts
In the project directory, you can run:

### `npm run dev`

Runs the storybook in the development mode.
Open http://localhost:6006 to view it in the browser.

The page will reload if you make edits.

### `npm run build`

Builds the static version of the storybook for production to the storybook-static folder.

### `npm run build:lib`

Build react-maintenance-planner library.

-----
This work has been supported by the grant [No. CK01000204 "Improving effectiveness of aircraft maintenance planning and execution"](https://starfos.tacr.cz/en/project/CK01000204) of Technology Agency of the Czech Republic.
