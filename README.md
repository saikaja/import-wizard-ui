# ImportWizard

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Demo mode

`npm run start:demo` (local) or `npm run build:demo` (static build) runs the UI with no backend. Every API
call is answered in the browser by `src/app/demo/demo-api.interceptor.ts` using sample data, so the full
five-step flow and the import history can be clicked through. Download a template in step 1 to get a test
file with a few deliberately invalid rows. The hosted demo on Vercel uses this build (see `vercel.json`).

The normal `ng serve` / `ng build` builds are unchanged and talk to the real API.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
