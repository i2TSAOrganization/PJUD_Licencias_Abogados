import { Injectable, computed, signal } from '@angular/core';

/** Cuenta los pedidos en curso para mostrar la barra de carga. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendientes = signal(0);
  readonly loading = computed(() => this.pendientes() > 0);

  show(): void {
    this.pendientes.update((n) => n + 1);
  }

  hide(): void {
    this.pendientes.update((n) => Math.max(0, n - 1));
  }
}
