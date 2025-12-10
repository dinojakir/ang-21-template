import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-event-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './event-form-dialog.component.html',
})
export class EventFormDialogComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<EventFormDialogComponent>) {
    this.form = fb.group({
      datum: ['', [Validators.required, this.futureDateValidator]],
      ort: ['', Validators.required],
      status: ['geplant', Validators.required],
    });
  }

  futureDateValidator(control: any) {
    return new Date(control.value) > new Date() ? null : { pastDate: true };
  }

  submit() {
    this.dialogRef.close(this.form.value);
  }
}
