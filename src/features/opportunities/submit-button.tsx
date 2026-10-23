'use client';

import { useFormStatus } from 'react-dom';

export function OpportunitySubmitButton({
  label,
  pendingLabel,
  value,
}: {
  label: string;
  pendingLabel: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="ui-button ui-button--secondary"
      type="submit"
      name={value ? 'status' : undefined}
      value={value}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
