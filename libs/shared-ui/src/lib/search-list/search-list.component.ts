import { CommonModule } from '@angular/common';
import { Component, ContentChild, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    SearchEmptyTemplateDirective,
    SearchFooterTemplateDirective,
    SearchHeaderTemplateDirective,
    SearchItemTemplateDirective,
} from './templates';

type KeyPath = string; // e.g. "product_name", "company.name"

@Component({
  selector: 'ui-search-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-list.component.html',
  styleUrls: ['./search-list.component.scss'],
})
export class SearchListComponent<T extends Record<string, any>> {
  @Input() items: T[] = [];
  @Input() filterKeys: KeyPath[] = [];
  @Input() placeholder = 'Search...';
  @Input() debounceMs = 200;
  @Input() caseSensitive = false;
  @Input() trackByKey?: string;
  @Input() noResultText = 'No results';

  private _query = '';
  @Input()
  get query(): string {
    return this._query;
  }
  set query(v: string) {
    this._query = v ?? '';
    this.applyFilter();
  }
  @Output() queryChange = new EventEmitter<string>();
  @Output() itemSelected = new EventEmitter<T>();

  @ContentChild(SearchItemTemplateDirective) itemTpl?: SearchItemTemplateDirective;
  @ContentChild(SearchHeaderTemplateDirective) headerTpl?: SearchHeaderTemplateDirective;
  @ContentChild(SearchFooterTemplateDirective) footerTpl?: SearchFooterTemplateDirective;
  @ContentChild(SearchEmptyTemplateDirective) emptyTpl?: SearchEmptyTemplateDirective;

  filteredItems: T[] = [];
  private timer: any;
  activeIndex = -1;

  @ViewChild('queryInput') queryInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('itemEl') itemEls?: QueryList<ElementRef<HTMLElement>>;

  onQueryInput(v: string) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this._query = v ?? '';
      this.queryChange.emit(this._query);
      this.applyFilter();
    }, Math.max(0, this.debounceMs));
  }

  trackFn = (_: number, item: T) => (this.trackByKey ? item?.[this.trackByKey] ?? item : item);

  onSelect(item: T) {
    this.itemSelected.emit(item);
  }

  // Public API: allow parent to focus the search input
  focus(): void {
    setTimeout(() => this.queryInput?.nativeElement?.focus(), 0);
  }

  onInputKeydown(ev: KeyboardEvent): void {
    const len = this.filteredItems?.length ?? 0;
    if (!len) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.activeIndex = Math.min(len - 1, this.activeIndex + 1);
      this.scrollActiveIntoView();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.activeIndex = Math.max(0, this.activeIndex - 1);
      this.scrollActiveIntoView();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (this.activeIndex >= 0 && this.activeIndex < len) {
        const item = this.filteredItems[this.activeIndex];
        if (item) this.onSelect(item);
      }
    }
  }

  private getValueAtPath(obj: any, path: KeyPath): string {
    if (!obj || !path) return '';
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur == null) return '';
    }
    return String(cur ?? '');
  }

  private applyFilter() {
    const q = this.caseSensitive ? this._query : (this._query || '').toLowerCase();
    if (!q) {
      this.filteredItems = this.items?.slice() ?? [];
      // reset active index when clearing query
      this.activeIndex = this.filteredItems.length ? 0 : -1;
      return;
    }
    const keys = this.filterKeys && this.filterKeys.length ? this.filterKeys : [];
    this.filteredItems = (this.items || []).filter((it) => {
      if (!keys.length) {
        const hay = this.caseSensitive ? JSON.stringify(it) : JSON.stringify(it).toLowerCase();
        return hay.includes(q);
      }
      for (const k of keys) {
        const val = this.getValueAtPath(it, k);
        const hay = this.caseSensitive ? val : val.toLowerCase();
        if (hay.includes(q)) return true;
      }
      return false;
    });
    // Clamp active index when results change
    if (this.filteredItems.length === 0) this.activeIndex = -1;
    else if (this.activeIndex < 0) this.activeIndex = 0;
    else if (this.activeIndex >= this.filteredItems.length) this.activeIndex = this.filteredItems.length - 1;
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    const idx = this.activeIndex;
    const el = this.itemEls?.toArray()?.[idx]?.nativeElement;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }
}
