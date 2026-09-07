import type { ComponentProps } from 'react';

// Full page navigation works on both the static export and the Sites preview.
export default function PageLink({ children, ...props }: ComponentProps<'a'>) {
  return <a {...props}>{children}</a>;
}
