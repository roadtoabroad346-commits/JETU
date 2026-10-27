'use client';
import { useEffect, useRef } from 'react';
/** Carry only a one-purpose invitation through sign-in; never persist it in browser storage. */
export function InvitationField() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function update() {
      const value = new URLSearchParams(window.location.hash.slice(1)).get(
        'invite',
      );
      if (ref.current)
        ref.current.value = value && /^[a-f0-9]{64}$/.test(value) ? value : '';
    }
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <input ref={ref} type="hidden" name="inviteToken" defaultValue="" />;
}
