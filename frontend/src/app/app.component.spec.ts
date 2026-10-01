import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { ConfigService } from './services/config.service';

describe('AppComponent', () => {
  it('muestra el logo del Poder Judicial y, sin sesión, no muestra usuario', async () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: ConfigService, useValue: { getConfig: () => 'false' } },
        { provide: AuthService, useValue: { cargarSesion: () => of(null), usuario: () => null } },
      ],
    });
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('img.logo')?.getAttribute('alt')).toContain('Poder Judicial');
    expect(html.querySelector('.usuario')).toBeNull();
  });
});
