-- =============================================================================
-- Usuario de la aplicación: solo SELECT, INSERT y UPDATE. Sin DELETE, DROP ni ALTER:
-- la aplicación no borra nada (anula) y el esquema lo cambia un administrador.
--
-- Antes de correrlo, reemplazar <clave-larga> por una clave propia de cada ambiente
-- (la misma que va en DB_PASS del .env). Si la API no corre en el mismo servidor
-- que MySQL, cambiar '127.0.0.1' por la IP del servidor de la API.
-- =============================================================================

CREATE USER IF NOT EXISTS 'licencias_app'@'127.0.0.1' IDENTIFIED BY '<clave-larga>';
GRANT SELECT, INSERT, UPDATE ON podjud_licencias.* TO 'licencias_app'@'127.0.0.1';
FLUSH PRIVILEGES;
