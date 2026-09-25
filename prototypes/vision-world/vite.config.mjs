import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "live" ? "/vision/" : "/",
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: "gi-live-homepage",
    transformIndexHtml(html) {
      if (mode !== "live") return html;
      return html
        .replace('content="noindex,nofollow"', 'content="index,follow"')
        .replace('A local 3D concept for GI Healthcare’s vision of freshly cooked food, anywhere.', 'Explore GI Healthcare’s vision for autonomous cooking: freshly cooked, healthy meals for everyday life, extreme environments and beyond planet Earth.')
        .replace('</head>', `<link rel="canonical" href="https://www.gihealthcare.co.uk/" />
    <link rel="icon" type="image/png" sizes="96x96" href="/icons/gi-icon-96.png" />
    <link rel="apple-touch-icon" href="/icons/gi-icon-180.png" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","@id":"https://www.gihealthcare.co.uk/#organization","name":"GI Healthcare","legalName":"GI Healthcare Industries Limited","url":"https://www.gihealthcare.co.uk/","logo":"https://www.gihealthcare.co.uk/icons/gi-icon-512.png","description":"Developing autonomous cooking machines for everyday life, extreme environments and space exploration."}</script>
    <meta property="og:title" content="Our world of possibilities · GI Healthcare" />
    <meta property="og:description" content="Freshly cooked, healthy meals. Anyone, anytime, anywhere. Even beyond planet Earth." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.gihealthcare.co.uk/" />
    <meta property="og:image" content="https://www.gihealthcare.co.uk/icons/gi-icon-512.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <script src="/gi-home-ready.js" defer></script>
    <script src="/gi-privacy.js" defer></script>
  </head>`)
        .replace('<div id="root"></div>', `<div id="root"></div>
    <noscript><main><h1>Freshly cooked. Anywhere.</h1><p>GI Healthcare is developing autonomous cooking machines for everyday life, extreme environments and beyond planet Earth.</p><p>Enable JavaScript to explore our interactive world.</p><nav><a href="/research">Research</a> · <a href="/careers">Careers</a> · <a href="/contact">Contact us</a> · <a href="/privacy">Privacy notice</a></nav></main></noscript>`);
    },
  }],
}));
