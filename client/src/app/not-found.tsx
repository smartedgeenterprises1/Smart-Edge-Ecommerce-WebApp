import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-se py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted">That product or page is not available.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
