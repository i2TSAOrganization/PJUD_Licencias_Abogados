import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

/**
 * Configuración por entorno, igual que en CAS_Gestion_Usuarios_UI:
 * assets/env/env.json dice el entorno y assets/env/env.<entorno>.json trae los valores.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private config: Record<string, string> = {};
  private env: Record<string, string> = {};

  getConfig(key: string): string {
    return this.config[key];
  }

  getEnv(key: string): string {
    return this.env[key];
  }

  /** Base de la API. Vacía en local: el proxy de ng serve reenvía /api. */
  get apiUrl(): string {
    return this.config['api_url'] ?? '';
  }

  async load(): Promise<boolean> {
    try {
      this.env = await lastValueFrom(
        this.http.get<Record<string, string>>('./assets/env/env.json'),
      );
      if (!this.env?.['env']) {
        console.error('El archivo de entorno "env.json" no es válido');
        return true;
      }
      const url = `./assets/env/env.${this.env['env']}.json`;
      this.config = await lastValueFrom(this.http.get<Record<string, string>>(url));
    } catch (error) {
      console.error('Error cargando la configuración:', error);
    }
    return true;
  }
}
