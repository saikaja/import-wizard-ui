// src/app/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form = this.fb.group({
    name:     ['', Validators.required],
    password: ['', Validators.required],
  });
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router         // ← inject the Router
  ) {}

  submit() {
    if (this.form.invalid) {
      this.error = 'Please fill in both fields.';
      return;
    }
    const { name, password } = this.form.value;
    this.auth.login(name!, password!).subscribe({
      next: () => {
        // ← navigate into your wizard instead of reloading
        this.router.navigate(['wizard']);
      },
      error: () => {
        this.error = 'Invalid credentials';
      }
    });
  }
}
