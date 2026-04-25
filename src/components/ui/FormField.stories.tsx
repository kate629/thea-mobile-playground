import React from 'react';
import { FormField } from './FormField';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';

export default {
  title: 'UI/FormField',
  component: FormField,
};

const wrapStyle: React.CSSProperties = { width: 360 };

export const InputField = {
  render: () => (
    <div style={wrapStyle}>
      <FormField label="Email" required helperText="We'll never share your email.">
        {({ id, invalid, ...rest }) => (
          <Input id={id} type="email" placeholder="you@example.com" invalid={invalid} {...rest} />
        )}
      </FormField>
    </div>
  ),
};

export const InputFieldWithError = {
  render: () => (
    <div style={wrapStyle}>
      <FormField label="Email" required error="Please enter a valid email address.">
        {({ id, invalid, ...rest }) => (
          <Input id={id} type="email" defaultValue="not-an-email" invalid={invalid} {...rest} />
        )}
      </FormField>
    </div>
  ),
};

export const TextareaField = {
  render: () => (
    <div style={wrapStyle}>
      <FormField label="A few details" helperText="What do they love? What's their style?">
        {({ id, invalid, ...rest }) => (
          <Textarea id={id} placeholder="Tell us about them..." invalid={invalid} {...rest} />
        )}
      </FormField>
    </div>
  ),
};

export const SelectField = {
  render: () => (
    <div style={wrapStyle}>
      <FormField label="Relationship">
        {({ id, invalid, ...rest }) => (
          <Select
            id={id}
            invalid={invalid}
            placeholder="Choose one"
            options={[
              { value: 'partner', label: 'Partner' },
              { value: 'parent', label: 'Parent' },
              { value: 'sibling', label: 'Sibling' },
              { value: 'friend', label: 'Friend' },
            ]}
            {...rest}
          />
        )}
      </FormField>
    </div>
  ),
};
