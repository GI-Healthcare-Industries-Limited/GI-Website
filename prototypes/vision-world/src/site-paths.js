// The approved homepage is mounted inside the existing site; the standalone
// design preview keeps linking to the live secondary pages.
export const liveSite = import.meta.env.MODE === "live";
export const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`;
export const sitePath = (path) => liveSite ? path : `https://www.gihealthcare.co.uk${path}`;
