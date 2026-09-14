'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-se py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">{error.message}</p>
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
