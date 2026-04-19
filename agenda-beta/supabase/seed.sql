-- Datos de prueba (ejecutar con usuario autenticado o desde el SQL editor de Supabase)
insert into public.tipos_actividad (nombre, descripcion) values
  ('Instalación', 'Instalación de equipamiento en sitio'),
  ('Mantención', 'Mantención preventiva o correctiva'),
  ('Retiro', 'Retiro de equipamiento')
on conflict do nothing;

insert into public.tecnicos (nombre, apellidos, rut, tipo, tecnico_bermann, region) values
  ('Juan',  'Pérez González',    '11.111.111-1', 'interno', true,  'Santiago'),
  ('María', 'Soto Reyes',        '22.222.222-2', 'externo', false, 'Santiago'),
  ('Pedro', 'Contreras Muñoz',   '33.333.333-3', 'externo', false, 'Valparaíso')
on conflict (rut) do nothing;
