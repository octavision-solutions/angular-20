import { Component } from '@angular/core';
import { SharedModule } from '../../theme/shared/shared.module';

@Component({
  selector: 'app-basic-badge',
  imports: [SharedModule],
  templateUrl: './basic-badge.component.html',
  styleUrls: ['./basic-badge.component.scss']
})
export class BasicBadgeComponent {}
