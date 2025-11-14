// angular import
import { Component, output } from '@angular/core';

// project import
import { SharedModule } from '../../../../theme/shared/shared.module';
import { NavContentComponent } from './nav-content/nav-content.component';
import { NavLogoComponent } from './nav-logo/nav-logo.component';

@Component({
  selector: 'app-navigation',
  imports: [SharedModule, NavLogoComponent, NavContentComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  // public props
  NavCollapse = output();
  NavCollapsedMob = output();
  navCollapsed = false;
  navCollapsedMob = false;
  windowWidth: number;

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsed = false;
  }

  // public method
  navCollapse() {
    if (this.windowWidth >= 992) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }

  navCollapseMob() {
    if (this.windowWidth < 992) {
      this.NavCollapsedMob.emit();
    }
  }
}
