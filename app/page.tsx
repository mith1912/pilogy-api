export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-3xl font-semibold">Numerology API</h1>
      <p className="mt-4">Stateless backend for the Numerology mobile application.</p>
      <p className="mt-4">API base path: <code>/api/v1</code></p>
      <p className="mt-4">Pythagorean V1 calculations are available.</p>
      <a className="mt-4 inline-block underline" href="/api/v1/health">Service health</a>
    </main>
  );
}
