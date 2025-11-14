import { Directive, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[searchItemTemplate]' })
export class SearchItemTemplateDirective {
  constructor(public template: TemplateRef<any>) {}
}

@Directive({ selector: 'ng-template[searchHeaderTemplate]' })
export class SearchHeaderTemplateDirective {
  constructor(public template: TemplateRef<any>) {}
}

@Directive({ selector: 'ng-template[searchFooterTemplate]' })
export class SearchFooterTemplateDirective {
  constructor(public template: TemplateRef<any>) {}
}

@Directive({ selector: 'ng-template[searchEmptyTemplate]' })
export class SearchEmptyTemplateDirective {
  constructor(public template: TemplateRef<any>) {}
}
