import { Injectable, computed, inject, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import * as Sentry from '@sentry/angular';
import { SupabaseService } from '../supabase/supabase.service';
import { PermisosService } from '../services/permisos.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService);
  private readonly permisos = inject(PermisosService);

  private readonly sessionSig = signal<Session | null>(null);
  readonly user = computed<User | null>(() => this.sessionSig()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionSig() !== null);

  constructor() {
    this.sb.client.auth.getSession().then(({ data }) => {
      this.sessionSig.set(data.session);
      if (data.session?.user) {
        this.identifyForSentry(data.session.user);
        this.cargarPermisos(data.session.user.id);
      }
    });
    this.sb.client.auth.onAuthStateChange((event, session) => {
      this.sessionSig.set(session);
      if (event === 'SIGNED_IN' && session?.user) {
        this.identifyForSentry(session.user);
        this.cargarPermisos(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        Sentry.setUser(null);
        this.permisos.limpiar();
      }
    });
  }

  private identifyForSentry(user: User): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  }

  private cargarPermisos(userId: string): void {
    this.permisos.cargar(userId).catch(() => {
      // Silencioso: si falla, el usuario queda sin permisos y el guard lo saca
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.sb.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await this.permisos.cargar(data.user.id);
    return data;
  }

  async signUp(email: string, password: string, nombre: string, apellido: string) {
    const { data, error } = await this.sb.client.auth.signUp({
      email,
      password,
      options: { data: { nombre, apellido } },
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.sb.client.auth.signOut();
    this.permisos.limpiar();
  }
}
