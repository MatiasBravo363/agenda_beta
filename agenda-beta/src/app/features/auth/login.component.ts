import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { mensajeAuthGenerico } from '../../core/auth/error-messages.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="card w-full max-w-md p-8">
        <div class="mb-8">
          <div class="text-2xl font-extrabold tracking-tight">Agenda<span class="text-brand-600">_BETA</span></div>
          <p class="text-slate-500 text-sm mt-1">Gestión de actividades de técnicos en terreno.</p>
        </div>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label">Email</label>
            <input class="input" type="email" [(ngModel)]="email" name="email" required autocomplete="email"/>
          </div>
          <div>
            <label class="label">Contraseña</label>
            <input class="input" type="password" [(ngModel)]="password" name="password" required autocomplete="current-password"/>
          </div>

          @if (error()) {
            <div class="text-sm text-red-600">{{ error() }}</div>
          }

          <button class="btn-primary w-full" type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>

        <div class="text-sm text-slate-500 mt-6 text-center">
          ¿Olvidaste tu contraseña? <a routerLink="/reset-password" class="text-brand-600 font-medium">Recuperarla</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async submit() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/actividades']);
    } catch (e: any) {
      this.error.set(mensajeAuthGenerico(e));
    } finally {
      this.loading.set(false);
    }
  }
}
