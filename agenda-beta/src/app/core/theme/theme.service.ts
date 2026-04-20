import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'agenda_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(this.readPref());

  constructor() {
    this.apply(this.isDark());
  }

  toggle() { this.setDark(!this.isDark()); }

  setDark(dark: boolean) {
    this.isDark.set(dark);
    this.apply(dark);
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch {}
  }

  private apply(dark: boolean) {
    const el = document.documentElement;
    if (dark) el.classList.add('dark'); else el.classList.remove('dark');
  }

  private readPref(): boolean {
    try { return localStorage.getItem(STORAGE_KEY) === 'dark'; } catch { return false; }
  }
}
