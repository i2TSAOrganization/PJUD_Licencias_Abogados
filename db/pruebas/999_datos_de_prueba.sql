-- =============================================================================
-- SOLO desarrollo y preproducción. NO ejecutar en producción.
-- 100.000 licencias de prueba para medir paginación, filtros y orden.
-- MySQL 5.7 no tiene WITH RECURSIVE: los números salen de cruzar cinco veces 0-9.
--
--   mysql -u <admin> -p podjud_licencias < db/pruebas/999_datos_de_prueba.sql
-- =============================================================================

USE podjud_licencias;

-- Usuario dueño de los datos de prueba (inactivo: no puede ingresar)
INSERT IGNORE INTO usuario (id, usuario, nombre, email, rol, password_hash, activo)
VALUES (1, 'prueba', 'Datos de prueba', 'prueba@localhost', 'contenidista', '-', 0);

INSERT INTO licencia (colegio_id, apellido_nombre, matricula, matricula_norm, tipo_profesional,
                      fecha_comienzo, dias_habiles, tipo_licencia_id, observacion, creado_por)
SELECT 1 + MOD(n.i, 5),
       CONCAT('APELLIDO', n.i, ', Nombre'),
       CONCAT('M-', n.i),
       CONCAT('m', n.i),                      -- lo mismo que normMatricula('M-<i>')
       IF(MOD(n.i, 7) = 3, 'P', 'A'),         -- unos pocos procuradores
       DATE_ADD('2026-01-05', INTERVAL MOD(n.i, 350) DAY),
       1 + MOD(n.i, 30),
       3,                                     -- tipo "Otro (días a mano)"
       'Dato de prueba',
       1
FROM (
  SELECT 1 + a.d + 10 * b.d + 100 * c.d + 1000 * e.d + 10000 * f.d AS i
  FROM (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
       (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
       (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c,
       (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) e,
       (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) f
) n;
