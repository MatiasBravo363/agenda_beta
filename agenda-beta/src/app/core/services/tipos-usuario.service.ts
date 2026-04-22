import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { TipoUsuario, Permiso, PermisoCodigo } from '../models';

@Injectable({ providedIn: 'root' })
export class TiposUsuarioService {
  private sb = inject(SupabaseService);

  async list(): Promise<TipoUsuario[]> {
    const { data, error } = await this.sb.client
      .from('tipos_usuario')
      .select('*')
      .order('nombre');
    if (error) throw error;
    return (data ?? []) as TipoUsuario[];
  }

  async listConConteos(): Promise<TipoUsuario[]> {
    const [tipos, asignaciones, usuarios] = await Promise.all([
      this.list(),
      this.sb.client.from('tipos_usuario_permisos').select('tipo_usuario_id'),
      this.sb.client.from('usuarios').select('tipo_usuario_id'),
    ]);
    const permisosCount = new Map<string, number>();
    ((asignaciones.data ?? []) as Array<{ tipo_usuario_id: string }>).forEach((r) => {
      permisosCount.set(r.tipo_usuario_id, (permisosCount.get(r.tipo_usuario_id) ?? 0) + 1);
    });
    const usuariosCount = new Map<string, number>();
    ((usuarios.data ?? []) as Array<{ tipo_usuario_id: string | null }>).forEach((r) => {
      if (r.tipo_usuario_id) {
        usuariosCount.set(r.tipo_usuario_id, (usuariosCount.get(r.tipo_usuario_id) ?? 0) + 1);
      }
    });
    return tipos.map((t) => ({
      ...t,
      permisos_count: permisosCount.get(t.id) ?? 0,
      usuarios_count: usuariosCount.get(t.id) ?? 0,
    }));
  }

  async create(payload: { nombre: string; descripcion?: string | null }): Promise<TipoUsuario> {
    const { data, error } = await this.sb.client
      .from('tipos_usuario')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data as TipoUsuario;
  }

  async update(id: string, payload: Partial<TipoUsuario>): Promise<TipoUsuario> {
    const { data, error } = await this.sb.client
      .from('tipos_usuario')
      .update({ nombre: payload.nombre, descripcion: payload.descripcion })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as TipoUsuario;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from('tipos_usuario').delete().eq('id', id);
    if (error) throw error;
  }

  async permisosDeTipo(tipoId: string): Promise<string[]> {
    const { data, error } = await this.sb.client
      .from('tipos_usuario_permisos')
      .select('permiso_id')
      .eq('tipo_usuario_id', tipoId);
    if (error) throw error;
    return ((data ?? []) as Array<{ permiso_id: string }>).map((r) => r.permiso_id);
  }

  async setPermisos(tipoId: string, permisoIds: string[]): Promise<void> {
    const { error: delErr } = await this.sb.client
      .from('tipos_usuario_permisos')
      .delete()
      .eq('tipo_usuario_id', tipoId);
    if (delErr) throw delErr;
    if (permisoIds.length === 0) return;
    const rows = permisoIds.map((permiso_id) => ({ tipo_usuario_id: tipoId, permiso_id }));
    const { error: insErr } = await this.sb.client.from('tipos_usuario_permisos').insert(rows);
    if (insErr) throw insErr;
  }

  async listPermisos(): Promise<Permiso[]> {
    const { data, error } = await this.sb.client.from('permisos').select('*').order('categoria');
    if (error) throw error;
    return (data ?? []) as Permiso[];
  }

  async permisosDeUsuario(userId: string): Promise<PermisoCodigo[]> {
    const { data: user, error: eUser } = await this.sb.client
      .from('usuarios')
      .select('tipo_usuario_id')
      .eq('id', userId)
      .maybeSingle();
    if (eUser) throw eUser;
    if (!user?.tipo_usuario_id) return [];
    const { data, error } = await this.sb.client
      .from('tipos_usuario_permisos')
      .select('permiso_id, permisos(codigo)')
      .eq('tipo_usuario_id', user.tipo_usuario_id);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<{ permisos: { codigo: PermisoCodigo } | Array<{ codigo: PermisoCodigo }> | null }>;
    const codigos: PermisoCodigo[] = [];
    for (const r of rows) {
      const p = r.permisos;
      if (!p) continue;
      if (Array.isArray(p)) {
        p.forEach((x) => x?.codigo && codigos.push(x.codigo));
      } else {
        if (p.codigo) codigos.push(p.codigo);
      }
    }
    return codigos;
  }
}
