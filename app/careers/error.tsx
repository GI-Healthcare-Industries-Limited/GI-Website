"use client";
export default function CareersError({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: "80px 8%", maxWidth: 800 }}>
      <h1>We couldn’t load the opportunities.</h1>
      <p>
        Please try again shortly. Your existing application links have not
        changed.
      </p>
      <button onClick={reset}>Try again</button> ·{" "}
      <a href="/contact">Contact us</a>
    </main>
  );
}
