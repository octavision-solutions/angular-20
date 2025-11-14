import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedUi } from '@version-20/shared-ui';
import { NxWelcome } from './nx-welcome';
@Component({
  imports: [NxWelcome, RouterModule, SharedUi],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'my-app';
}
