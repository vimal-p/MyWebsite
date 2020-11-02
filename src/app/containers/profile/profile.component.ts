import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Subscription } from 'rxjs/Rx';

import { dataIsSuccess } from 'app/common';
import { AuthStore, UserStore } from 'app/stores';
import { User, ResponseData, ErrorMessage } from 'app/models';

@Component({
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  form: FormGroup;
  model: User;
  avatarSrc: string | undefined;
  avatarFile: File | undefined;
  uploaded = false;
  avatarTooSmall = false;
  avatarTooLarge = false;

  modelSubscription: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private authStore: AuthStore,
    private userStore: UserStore
  ) {
    this.modelSubscription = authStore.user.subscribe((item: User) => {
      this.model = item;
    });
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: [
        '',
        [
          Validators.minLength(2),
          Validators.maxLength(20)
        ]
      ],
      email: [
        '',
        [
          // Validates when control value isn't empty
          (control: AbstractControl) => control.value ? Validators.email(control) : null
        ]
      ],
      passwordNew: [
        '',
        [
          Validators.minLength(6),
          Validators.maxLength(40)
        ]
      ]
    });
  }

  ngOnDestroy(): void {
    this.modelSubscription.unsubscribe();
  }

  get avatarInvalid(): boolean {
    return this.avatarTooSmall || this.avatarTooLarge;
  }

  get username(): AbstractControl {
    return this.form.get('username');
  }

  get email(): AbstractControl {
    return this.form.get('email');
  }

  get passwordNew(): AbstractControl {
    return this.form.get('passwordNew');
  }

  selectAvatar(files: FileList): void {
    const file: File | undefined = files[0];
    this.avatarFile = file;
    this.uploaded = false;

    if (file) {
      const reader = new FileReader();

      /**
       * Is there a better solution?
       * @see https://github.com/Microsoft/TypeScript/issues/299#issuecomment-168538829
       */
      reader.onload = (e: Event) => {
        this.avatarSrc = e.target['result'];
      };
      reader.readAsDataURL(file);
      this.avatarTooSmall = file.size < 100;
      this.avatarTooLarge = file.size > 1024 * 200;
    } else {
      this.avatarSrc = undefined;
      this.avatarTooSmall = false;
      this.avatarTooLarge = false;
    }
  }

  updateAvatar(): void {
    this.userStore.updateAvatar(this.model, this.avatarFile)
      .subscribe((data: ResponseData) => {
        if (dataIsSuccess(data)) {
          this.authStore.replace({
            ...this.model,
            ...data.data
          });
          this.uploaded = true;
          this.showMessage('Avatar update successful!');
        }
      }, (errorResp: HttpErrorResponse) => {
        if (errorResp.status === 422) {
          const error: ErrorMessage | undefined = errorResp.error.data.find(
            (errorMessage: ErrorMessage) => errorMessage.field === 'avatarFile'
          );
          if (error) {
            this.showMessage(error.message);
          }
        }
      });
  }

  updateUsername(): void {
    this.updateField('username');
  }

  updateEmail(): void {
    this.updateField('email');
  }

  updatePassword(): void {
    this.updateField('passwordNew');
  }

  updateField(field: 'username' | 'email' | 'passwordNew'): void {
    this.userStore.update({
      ...this.model,
      [field]: this[field].value
    }).subscribe((data: ResponseData) => {
      if (dataIsSuccess(data)) {
        this.authStore.replace({
          ...this.model,
          ...data.data
        });
        this[field].reset();
        this.showMessage('Update completed!');
      }
    }, (errorResp: HttpErrorResponse) => {
      if (errorResp.status === 422) {
        errorResp.error.data.forEach((errorMessage: ErrorMessage) => {
          this.form.get(errorMessage.field).setErrors({
            message: errorMessage.message
          });
        });
      }
    });
  }

  showMessage(message: string, action: string = 'Close'): void {
    this.snackBar.open(message, action, {
      duration: 4000,
    });
  }
}
