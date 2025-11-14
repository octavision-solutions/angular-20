// angular import
import { Location } from '@angular/common';
import { Component, inject, output } from '@angular/core';

// project import
import { environment } from '../../../../../../environments/environment';
import { SharedModule } from '../../../../../theme/shared/shared.module';
import { NavigationItem, NavigationItems } from '../navigation';
import { NavGroupComponent } from './nav-group/nav-group.component';

@Component({
  selector: 'app-nav-content',
  imports: [SharedModule, NavGroupComponent],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent {
  private location = inject(Location);

  // public method
  // version
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;

  navigations!: NavigationItem[];
  wrapperWidth!: number;
  windowWidth = window.innerWidth;

  NavCollapsedMob = output();

  // constructor
  constructor() {
    this.navigations = NavigationItems;
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = (this.location as any)['_baseHref'];
    if (baseHref !== '/') {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('pcoded-hasmenu')) {
        parent.classList.add('pcoded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('pcoded-hasmenu')) {
        up_parent.classList.add('pcoded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('pcoded-hasmenu')) {
        last_parent.classList.add('pcoded-trigger');
        last_parent.classList.add('active');
      }
    }
  }
}
