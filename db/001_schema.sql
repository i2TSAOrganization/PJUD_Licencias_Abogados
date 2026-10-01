-- =============================================================================
-- Licencias de abogados y procuradores · esquema (MySQL 5.7)
-- Fuente: modelado de datos y arquitectura v6 (01/10/2026), sección 5.3, más la
-- tabla `sesion` (decisión del 01/10: sesión revocable del lado del servidor).
-- No hay base en producción todavía: los cambios van directo en este script.
-- Lo corre un usuario administrador. La aplicación usa licencias_app, que
-- solo tiene SELECT, INSERT y UPDATE (ver 003_usuario_app.sql).
--
-- Diferencias con el script del modelado (escrito para MySQL 8.4):
--   * Colación utf8mb4_unicode_ci (utf8mb4_0900_ai_ci no existe en 5.7). También
--     ignora tildes y mayúsculas: "garcia" encuentra "García".
--   * El servidor usa latin1 por defecto: cada tabla declara utf8mb4 explícitamente.
--   * Sin REGEXP_REPLACE en 5.7: matricula_norm es una columna común que calcula
--     la API con normMatricula() (businessLayer/utils/texto.js) al crear y al corregir.
--   * 5.7 acepta CHECK pero no lo aplica: esas reglas las valida la API.
--     tipo_profesional es ENUM('A','P'), que sí lo controla MySQL en modo estricto.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS podjud_licencias
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE podjud_licencias;

CREATE TABLE colegio (
  id              TINYINT UNSIGNED NOT NULL,
  codigo          VARCHAR(10)      NOT NULL,
  nombre          VARCHAR(60)      NOT NULL,
  circunscripcion TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_colegio_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario       VARCHAR(60)  NOT NULL,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  rol           VARCHAR(30)  NOT NULL DEFAULT 'contenidista',
  password_hash VARCHAR(255) NOT NULL,                -- bcrypt
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sesión del contenidista. Nunca se borra: se cierra con cerrada_en.
-- Vence por inactividad (RN-11) comparando ultimo_uso con SESION_MINUTOS.
CREATE TABLE sesion (
  id          CHAR(36)     NOT NULL,                  -- UUID, viaja dentro del JWT
  usuario_id  INT UNSIGNED NOT NULL,
  creada_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_uso  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cerrada_en  DATETIME     NULL,
  ip          VARCHAR(45)  NULL,
  PRIMARY KEY (id),
  KEY ix_sesion_usuario (usuario_id, cerrada_en),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas que valida la API (en 5.7 un CHECK no se aplica):
--   dias_a_mano = 1  => dias_habiles vacío;  dias_a_mano = 0 => dias_habiles >= 1
--   dias_maximo_anual vacío o >= 1
CREATE TABLE tipo_licencia (
  id                   TINYINT UNSIGNED  NOT NULL,
  codigo               VARCHAR(10)       NOT NULL,
  nombre               VARCHAR(80)       NOT NULL,
  dias_habiles         SMALLINT UNSIGNED NULL,      -- días fijos; vacío si se escriben a mano
  dias_a_mano          TINYINT(1)        NOT NULL DEFAULT 0,
  requiere_observacion TINYINT(1)        NOT NULL DEFAULT 0,
  dias_maximo_anual    SMALLINT UNSIGNED NULL,      -- máximo de días por año; vacío = sin máximo
  tope_bloquea         TINYINT(1)        NOT NULL DEFAULT 0,   -- 0 avisa y se carga; 1 error y no se carga
  activo               TINYINT(1)        NOT NULL DEFAULT 1,
  orden                TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lote_carga (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  numero        VARCHAR(20)       NULL,            -- AAAA-MM-DD-NN, se asigna al confirmar
  archivo       VARCHAR(200)      NOT NULL,
  estado        ENUM('BORRADOR','CONFIRMADO','REVERTIDO','DESCARTADO') NOT NULL DEFAULT 'BORRADOR',
  filas_total   SMALLINT UNSIGNED NOT NULL,
  filas_ok      SMALLINT UNSIGNED NOT NULL,
  filas_aviso   SMALLINT UNSIGNED NOT NULL,
  filas_error   SMALLINT UNSIGNED NOT NULL,
  creado_por    INT UNSIGNED      NOT NULL,
  creado_en     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmado_en DATETIME          NULL,
  revertido_en  DATETIME          NULL,
  revertido_por INT UNSIGNED      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lote_numero (numero),
  CONSTRAINT fk_lote_creado_por    FOREIGN KEY (creado_por)    REFERENCES usuario (id),
  CONSTRAINT fk_lote_revertido_por FOREIGN KEY (revertido_por) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lote_carga_fila (
  id               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  lote_id          INT UNSIGNED      NOT NULL,
  nro_fila         SMALLINT UNSIGNED NOT NULL,
  resultado        ENUM('OK','AVISO','ERROR') NOT NULL,
  mensajes         JSON              NULL,
  colegio_txt      VARCHAR(60)       NULL,          -- como vino en el archivo
  colegio_id       TINYINT UNSIGNED  NULL,          -- resuelto, si el Colegio era válido
  apellido_nombre  VARCHAR(120)      NULL,
  matricula        VARCHAR(40)       NULL,
  profesional_txt  VARCHAR(30)       NULL,          -- como vino en el archivo
  tipo_profesional ENUM('A','P')     NULL,          -- resuelto, si era válido
  fecha_comienzo   DATE              NULL,
  dias_txt         VARCHAR(20)       NULL,          -- como vino en el archivo
  dias_habiles     SMALLINT UNSIGNED NULL,
  tipo_txt         VARCHAR(80)       NULL,          -- como vino en el archivo
  tipo_licencia_id TINYINT UNSIGNED  NULL,          -- resuelto, si el tipo era válido
  observacion      VARCHAR(255)      NULL,
  licencia_id      INT UNSIGNED      NULL,          -- se completa al confirmar
  PRIMARY KEY (id),
  KEY ix_fila_lote (lote_id, resultado, nro_fila),
  CONSTRAINT fk_fila_lote FOREIGN KEY (lote_id) REFERENCES lote_carga (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reglas que valida la API (en 5.7 un CHECK no se aplica): dias_habiles >= 1
CREATE TABLE licencia (
  id               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  colegio_id       TINYINT UNSIGNED  NOT NULL,
  -- Siempre "APELLIDO, Nombre": la carga individual lo arma desde apellido y nombre
  apellido_nombre  VARCHAR(120)      NOT NULL,
  matricula        VARCHAR(40)       NOT NULL,
  -- La calcula la API con normMatricula(): minúsculas y solo letras y números. Es lo que se busca
  matricula_norm   VARCHAR(40)       NOT NULL,
  tipo_profesional ENUM('A','P')     NOT NULL,      -- 'A' abogado/a, 'P' procurador/a. Dato público
  fecha_comienzo   DATE              NOT NULL,
  dias_habiles     SMALLINT UNSIGNED NOT NULL,
  tipo_licencia_id TINYINT UNSIGNED  NOT NULL,
  observacion      VARCHAR(255)      NULL,
  anulada          TINYINT(1)        NOT NULL DEFAULT 0,
  motivo_anulacion VARCHAR(200)      NULL,
  anulada_en       DATETIME          NULL,
  anulada_por      INT UNSIGNED      NULL,
  lote_id          INT UNSIGNED      NULL,
  creado_por       INT UNSIGNED      NOT NULL,
  creado_en        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modificado_por   INT UNSIGNED      NULL,
  modificado_en    DATETIME          NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_licencia_colegio        FOREIGN KEY (colegio_id)       REFERENCES colegio (id),
  CONSTRAINT fk_licencia_tipo           FOREIGN KEY (tipo_licencia_id) REFERENCES tipo_licencia (id),
  CONSTRAINT fk_licencia_creado_por     FOREIGN KEY (creado_por)       REFERENCES usuario (id),
  CONSTRAINT fk_licencia_modificado_por FOREIGN KEY (modificado_por)   REFERENCES usuario (id),
  CONSTRAINT fk_licencia_anulada_por    FOREIGN KEY (anulada_por)      REFERENCES usuario (id),
  CONSTRAINT fk_licencia_lote           FOREIGN KEY (lote_id)          REFERENCES lote_carga (id),
  KEY ix_licencia_listado   (anulada, fecha_comienzo, id),
  KEY ix_licencia_colegio   (colegio_id, fecha_comienzo),
  KEY ix_licencia_matricula (colegio_id, matricula_norm, fecha_comienzo),
  KEY ix_licencia_lote (lote_id),
  KEY ix_licencia_tipo (tipo_licencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
