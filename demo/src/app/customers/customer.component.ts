import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidatorFn,
  FormArray
} from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';

interface ValidationMessages {
  required: string;
  email: string;
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmEmail = c.get('confirmEmail');

  if (emailControl?.value === confirmEmail?.value) {
    return null;
  }

  return { match: true };
}

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value != null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { range: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;
  customer = new Customer();

  emailMessage: string = '';

  private validationMessages: ValidationMessages = {
    required: 'Please enter your email address',
    email: 'Please enter a valid email address',
  };

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group(
        {
          email: ['', [Validators.required, Validators.email]],
          confirmEmail: ['', Validators.required],
        },
        { validators: [emailMatcher] }
      ),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,

      addresses: this.fb.array([this.buildAddress()])
    });

    this.customerForm
      .get('notification')
      ?.valueChanges.subscribe((value) => this.setNotification(value));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe((value) =>
      this.setMessage(emailControl)
    );
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors)
        .map((key) => this.validationMessages[key as keyof ValidationMessages])
        .join(' ');
    }
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl?.setValidators(Validators.required);
    } else {
      phoneControl?.clearValidators();
    }

    phoneControl?.updateValueAndValidity();
    //console.log(this.customerForm);
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      emailGroup: {
        email: 'jack@torchwood.com',
      },
      sendCatalog: false,
    });
  }
}
