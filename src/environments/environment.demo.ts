// Used by `npm run build:demo`: all API calls are answered in the browser
// by DemoApiInterceptor with sample data. No backend is contacted.
export const environment = {
  production: true,
  demo: true,
  apiUrl: '/api'
};
