import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VersionCheckService } from './core/services/version-check.service';
import { UpdateBannerComponent } from './shared/components/update-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private versionCheck = inject(VersionCheckService);
  protected readonly title = signal('agenda-beta');

  ngOnInit(): void {
    this.versionCheck.iniciar();
  }
}
