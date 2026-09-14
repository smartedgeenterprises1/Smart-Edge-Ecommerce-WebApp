export default function Loading() {
  return (
    <div className="container-se py-16">
      <div className="skeleton h-10 w-64" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square" />
        ))}
      </div>
    </div>
  );
}
