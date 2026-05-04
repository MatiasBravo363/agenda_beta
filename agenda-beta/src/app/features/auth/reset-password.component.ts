import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { mensajeAuthGenerico } from '../../core/auth/error-messages.util';
import pkg from '../../../../package.json';

type Step = 'request' | 'sent' | 'update' | 'success';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="w-full max-w-md">
        <div class="card p-8">
          <div class="mb-8">
            <div class="text-2xl font-extrabold tracking-tight">Agenda<span class="text-brand-600">_BETA</span></div>
            <p class="text-slate-500 text-sm mt-1">Recuperar contraseña</p>
          </div>

          @if (step() === 'request') {
            <form (ngSubmit)="requestReset()" class="space-y-4">
              <p class="text-sm text-slate-600">
                Ingresá el email asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
              </p>
              <div>
                <label class="label">Email</label>
                <input class="input" type="email" [(ngModel)]="email" name="email" required autocomplete="email"/>
              </div>

              @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }

              <button class="btn-primary w-full" type="submit" [disabled]="loading()">
                {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
              </button>
            </form>
          }

          @if (step() === 'sent') {
            <div class="space-y-4">
              <div class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Enviamos un enlace a <strong>{{ email }}</strong>. Revisá tu bandeja de entrada (y la carpeta de spam).
                El enlace expira en 15 minutos.
              </div>

              <button
                class="btn-secondary w-full"
                type="button"
                (click)="resend()"
                [disabled]="cooldown() > 0 || loading()"
              >
                {{ cooldown() > 0 ? 'Reenviar (' + cooldown() + 's)' : (loading() ? 'Enviando…' : 'Reenviar email') }}
              </button>

              @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }
            </div>
          }

          @if (step() === 'update') {
            <form (ngSubmit)="updatePassword()" class="space-y-4">
              <div>
                <label class="label">Nueva contraseña</label>
                <input class="input" type="password" [(ngModel)]="password" name="password" required minlength="6" autocomplete="new-password"/>
              </div>
              <div>
                <label class="label">Confirmar contraseña</label>
                <input class="input" type="password" [(ngModel)]="confirm" name="confirm" required minlength="6" autocomplete="new-password"/>
              </div>

              @if (error()) { <div class="text-sm text-red-600">{{ error() }}</div> }

              <button class="btn-primary w-full" type="submit" [disabled]="loading()">
                {{ loading() ? 'Guardando…' : 'Actualizar contraseña' }}
              </button>
            </form>
          }

          @if (step() === 'success') {
            <div class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Contraseña actualizada. Te redirigimos al login en unos segundos…
            </div>
          }

          <div class="text-sm text-slate-500 mt-6 text-center">
            <a routerLink="/login" class="text-brand-600 font-medium">Volver al inicio de sesión</a>
          </div>
        </div>

        <p class="text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-4">V{{ version }}</p>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private sb = inject(SupabaseService);
  private router = inject(Router);

  email = '';
  password = '';
  confirm = '';

  loading = signal(false);
  error = signal<string | null>(null);
  step = signal<Step>('request');
  cooldown = signal(0);
  version = (pkg as { version: string }).version;

  private sub: { unsubscribe(): void } | null = null;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  async ngOnInit() {
    const { data } = this.sb.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.step.set('update');
      }
    });
    this.sub = data.subscription;

    const { data: sessionData } = await this.sb.client.auth.getSession();
    if (sessionData.session) {
      this.step.set('update');
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  async requestReset() {
    this.error.set(null);
    if (!this.validEmail(this.email)) {
      this.error.set('Ingresá un email válido.');
      return;
    }
    await this.sendResetEmail();
    if (!this.error()) this.step.set('sent');
  }

  async resend() {
    if (this.cooldown() > 0 || this.loading()) return;
    this.error.set(null);
    await this.sendResetEmail();
  }

  async updatePassword() {
    this.error.set(null);
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.password !== this.confirm) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    try {
      const { error } = await this.sb.client.auth.updateUser({ password: this.password });
      if (error) throw error;
      this.step.set('success');
      await this.sb.client.auth.signOut();
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (e: unknown) {
      this.error.set(mensajeAuthGenerico(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async sendResetEmail(): Promise<void> {
    this.loading.set(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await this.sb.client.auth.resetPasswordForEmail(this.email, { redirectTo });
      if (error) throw error;
      this.startCooldown(60);
    } catch (e: unknown) {
      this.error.set(mensajeAuthGenerico(e));
    } finally {
      this.loading.set(false);
    }
  }

  private validEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private startCooldown(seconds: number) {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldown.set(seconds);
    this.cooldownTimer = setInterval(() => {
      const remaining = this.cooldown() - 1;
      this.cooldown.set(remaining);
      if (remaining <= 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }
}
