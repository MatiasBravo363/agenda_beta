import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="card w-full max-w-md p-8">
        <div class="mb-8">
          <div class="text-2xl font-extrabold tracking-tight">Crear cuenta</div>
          <p class="text-slate-500 text-sm mt-1">Acceso interno a Agenda_BETA.</p>
        </div>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nombre</label>
              <input class="input" [(ngModel)]="nombre" name="nombre" required/>
            </div>
            <div>
              <label class="label">Apellido</label>
              <input class="input" [(ngModel)]="apellido" name="apellido" required/>
            </div>
          </div>
          <div>
            <label class="label">Email</label>
            <input class="input" type="email" [(ngModel)]="email" name="email" required/>
          </div>
          <div>
            <label class="label">Contraseña</label>
            <input class="input" type="password" [(ngModel)]="password" name="password" required minlength="6"/>
          </div>

          @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }
          @if (success()) { <div class="text-sm text-green-600">{{ success() }}</div> }

          <button class="btn-primary w-full" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creando…' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="text-sm text-slate-500 mt-6 text-center">
          ¿Ya tienes cuenta? <a routerLink="/login" class="text-brand-600 font-medium">Ingresar</a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  nombre = '';
  apellido = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  async submit() {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      await this.auth.signUp(this.email, this.password, this.nombre, this.apellido);
      this.success.set('Cuenta creada. Revisa tu correo si la confirmación está activa y luego inicia sesión.');
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al crear la cuenta');
    } finally {
      this.loading.set(false);
    }
  }
}
