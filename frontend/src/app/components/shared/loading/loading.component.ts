import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../services/utils/loading.service';

/** Barra fina arriba mientras hay pedidos al back en curso (no bloquea la pantalla). */
@Component({
  selector: 'app-loading',
  imports: [MatProgressBarModule],
  template: `
    <div class="loading">
      @if (loadingService.loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Cargando" />
      }
    </div>
  `,
  styles: `
    .loading {
      height: 4px;
    }
  `,
})
export class LoadingComponent {
  protected readonly loadingService = inject(LoadingService);
}
