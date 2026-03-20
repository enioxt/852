'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Redirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(`/papo-de-corredor?view=discussoes${params ? `&${params}` : ''}`);
  }, [router, searchParams]);

  return null;
}

export default function IssuesRedirect() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}
