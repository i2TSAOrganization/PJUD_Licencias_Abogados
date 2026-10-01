import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoadingComponent } from './components/shared/loading/loading.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, LoadingComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    // Recupera la sesión (cookie) para mostrar el usuario en la barra
    inject(AuthService).cargarSesion().subscribe();
  }
}
