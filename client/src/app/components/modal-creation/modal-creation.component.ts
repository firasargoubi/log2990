import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-modal-creation',
  templateUrl: './modal-creation.component.html',
  styleUrls: ['./modal-creation.component.scss'],
  imports: [CommonModule],
})
export class ModalCreationComponent {
  show = false; 

  @Output() onSubmit = new EventEmitter<{ mode: string; size: string }>();

  open() {
    this.show = true;
  }

  // Fermer la modale
  close() {
    this.show = false;
  }

  submit() {
    const mode = (document.querySelector('input[name="mode"]:checked') as HTMLInputElement)?.value || '';
    const size = (document.querySelector('input[name="size"]:checked') as HTMLInputElement)?.value || '';

    // Émet l'objet avec `mode` et `size`
    this.onSubmit.emit({ mode, size });
    this.close();
  }
}
