// angular import
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// project import
import { SpinnerComponent } from './theme/shared/components/spinner/spinner.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, SpinnerComponent]
})
export class AppComponent {
  title = 'mantis-free-version';
  private themeService = inject(ThemeService);

  constructor() {
    this.themeService.initTheme();
  }
}
