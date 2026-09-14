'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }
  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-xl font-bold">Message noted</h2>
        <p className="mt-2 text-sm text-muted">
          This form confirms locally — please use the store phone or email listed for urgent help.
        </p>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-white p-6">
      <Field label="Name" htmlFor="name">
        <Input id="name" required name="name" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" required name="email" />
      </Field>
      <Field label="Message" htmlFor="message">
        <Textarea id="message" required name="message" />
      </Field>
      <Button type="submit">Send message</Button>
    </form>
  );
}
