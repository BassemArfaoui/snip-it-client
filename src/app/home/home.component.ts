import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'snip-it-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section style="display:flex;align-items:center;justify-content:center;height:80vh">
      <h1>Hello, world</h1>
    </section>
  `
})
export class HomeComponent {}
