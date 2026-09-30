import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app/app.component';
import { routes }       from './app/app.routes';
import { JwtInterceptor } from './app/interceptors/jwt.interceptor';
import { DemoApiInterceptor } from './app/demo/demo-api.interceptor';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule, ReactiveFormsModule),
    provideRouter(routes),
    // classic HTTP_INTERCEPTORS multi-provider
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    // demo build only: answer API calls with sample data
    ...(environment.demo ? [{ provide: HTTP_INTERCEPTORS, useClass: DemoApiInterceptor, multi: true }] : [])
  ]
}).catch(err => console.error(err));
