import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="card w-full max-w-md p-8">
        <div class="mb-8">
          <div class="text-2xl font-extrabold tracking-tight">Agenda<span class="text-brand-600">_BETA</span></div>
          <p class="text-slate-500 text-sm mt-1">Recuperar contraseña</p>
        </div>

        @if (!ready()) {
          <p class="text-sm text-slate-500">
            Esperando enlace de recuperación… Si abriste este formulario sin un email válido de reset, volvé a
            <a routerLink="/login" class="text-brand-600 font-medium">iniciar sesión</a>.
          </p>
        } @else {
          <form (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="label">Nueva contraseña</label>
              <input class="input" type="password" [(ngModel)]="password" name="password" required minlength="6" autocomplete="new-password"/>
            </div>
            <div>
              <label class="label">Confirmar contraseña</label>
              <input class="input" type="password" [(ngModel)]="confirm" name="confirm" required minlength="6" autocomplete="new-password"/>
            </div>

            @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }
            @if (success()) { <div class="text-sm text-green-700">Contraseña actualizada. Redirigiendo al login…</div> }

            <button class="btn-primary w-full" type="submit" [disabled]="loading() || success()">
              {{ loading() ? 'Guardando…' : 'Actualizar contraseña' }}
            </button>
          </form>
        }

        <div class="text-sm text-slate-500 mt-6 text-center">
          <a routerLink="/login" class="text-brand-600 font-medium">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private sb = inject(SupabaseService);
  private router = inject(Router);

  password = '';
  confirm = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  ready = signal(false);

  private sub: { unsubscribe(): void } | null = null;

  async ngOnInit() {
    const { data } = this.sb.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        this.ready.set(true);
      }
    });
    this.sub = data.subscription;

    const { data: sessionData } = await this.sb.client.auth.getSession();
    if (sessionData.session) this.ready.set(true);
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  async submit() {
    this.error.set(null);
    if (this.password.length < 6) { this.error.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (this.password !== this.confirm) { this.error.set('Las contraseñas no coinciden.'); return; }

    this.loading.set(true);
    try {
      const { error } = await this.sb.client.auth.updateUser({ password: this.password });
      if (error) throw error;
      this.success.set(true);
      await this.sb.client.auth.signOut();
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudo actualizar la contraseña.');
    } finally {
      this.loading.set(false);
    }
  }
}
