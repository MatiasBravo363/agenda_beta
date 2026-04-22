import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private sb = inject(SupabaseService);
  private readonly table = 'usuarios';

  async list(): Promise<Usuario[]> {
    const { data, error } = await this.sb.client
      .from(this.table)
      .select('*, tipo_usuario:tipos_usuario(id, nombre, descripcion)')
      .order('nombre');
    if (error) throw error;
    return (data ?? []) as Usuario[];
  }

  async update(id: string, payload: Partial<Usuario>): Promise<Usuario> {
    const { data, error } = await this.sb.client.from(this.table).update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Usuario;
  }

  async setActivo(id: string, activo: boolean): Promise<Usuario> {
    return this.update(id, { activo });
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }

  async sendPasswordReset(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await this.sb.client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async invite(email: string, nombre: string, apellido: string, tipoUsuarioId: string | null = null): Promise<void> {
    const { error } = await this.sb.client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { nombre, apellido, tipo_usuario_id: tipoUsuarioId },
      },
    });
    if (error) throw error;
    // El tipo se setea via trigger handle_new_user si lo incluimos ahí,
    // o mediante update post-confirmación. Para simplicidad: si tenemos tipoUsuarioId,
    // el super_admin puede ajustarlo manualmente desde la tabla después de que el
    // usuario confirme el email y aparezca en la lista.
  }
}
