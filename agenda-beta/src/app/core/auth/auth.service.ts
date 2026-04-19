import { Injectable, computed, inject, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService);

  private readonly sessionSig = signal<Session | null>(null);
  readonly user = computed<User | null>(() => this.sessionSig()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionSig() !== null);

  constructor() {
    this.sb.client.auth.getSession().then(({ data }) => this.sessionSig.set(data.session));
    this.sb.client.auth.onAuthStateChange((_event, session) => this.sessionSig.set(session));
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.sb.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
  }
}
