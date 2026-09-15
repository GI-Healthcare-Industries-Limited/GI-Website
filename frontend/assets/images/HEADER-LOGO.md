# Public header logo

`gi-healthcare-header-logo.webp` reuses the existing Contact-page logo as served
by the site's image optimiser, at 640 pixels wide and quality 75. It has no
embedded monitor ICC profile. The original PNG has an Apple display profile,
which can create a visibly different background in Safari's Flutter canvas.

Source (15 September 2026):
`https://www.gihealthcare.co.uk/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fgi-healthcare-logo.44a2gsh2_sg4f.png&w=640&q=75`

This is an existing optimised asset, not a newly generated or redrawn logo.
The source PNG, Contact page, application form and admin assets are unchanged.
The header remains `#e82127`, with the same desktop/mobile sizing and navigation
as Contact. After a future rebrand, reuse a colour-normalised export and verify
both browser DOM and Flutter canvas rendering before publishing.
