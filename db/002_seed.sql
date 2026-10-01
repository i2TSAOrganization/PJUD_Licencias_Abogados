-- =============================================================================
-- Licencias de abogados · datos iniciales (todos los ambientes, incluida producción)
-- Los 5 Colegios y el catálogo inicial de tipos de licencia.
-- =============================================================================

USE podjud_licencias;

INSERT INTO colegio (id, codigo, nombre, circunscripcion) VALUES
  (1, 'SFE', 'Santa Fe',      1),
  (2, 'ROS', 'Rosario',       2),
  (3, 'VTU', 'Venado Tuerto', 3),
  (4, 'REC', 'Reconquista',   4),
  (5, 'RAF', 'Rafaela',       5);

-- Días y máximo a confirmar con la Corte (D1, D2 de la reunión de validación).
INSERT INTO tipo_licencia (id, codigo, nombre, dias_habiles, dias_a_mano, requiere_observacion, dias_maximo_anual, tope_bloquea, orden) VALUES
  (1, 'FALL', 'Fallecimiento de familiar directo',  3,    0, 0, 3,    0, 1),   -- 3 por año (a confirmar): avisa
  (2, 'MAT',  'Maternidad, paternidad o adopción',  30,   0, 0, NULL, 0, 2),   -- 30 por evento, no por año
  (3, 'OTRO', 'Otro (días a mano)',                 NULL, 1, 1, NULL, 0, 9);

-- Mantener el catálogo (por script, en esta versión):
--   Agregar un tipo:  INSERT INTO tipo_licencia (id, codigo, nombre, dias_habiles, dias_a_mano, requiere_observacion, orden) VALUES (4, 'XXXX', 'Nombre', 5, 0, 0, 3);
--   Cambiar sus días: UPDATE tipo_licencia SET dias_habiles = 4 WHERE codigo = 'XXXX';   -- rige solo para cargas nuevas
--   Retirar un tipo:  UPDATE tipo_licencia SET activo = 0 WHERE codigo = 'XXXX';         -- no se borra: hay licencias que lo usan
--   Máximo anual:     UPDATE tipo_licencia SET dias_maximo_anual = 15 WHERE codigo = 'XXXX';
--   Que bloquee:      UPDATE tipo_licencia SET tope_bloquea = 1 WHERE codigo = 'FALL';
