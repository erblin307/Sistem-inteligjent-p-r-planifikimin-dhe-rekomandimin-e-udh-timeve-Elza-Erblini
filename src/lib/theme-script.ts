/**
 * Light/dark theme bootstrap. The `.dark` class on <html> switches every token
 * in globals.css. The choice is stored in localStorage; with no stored choice
 * the operating system preference applies. THEME_INIT_SCRIPT is inlined in
 * src/app/layout.tsx and runs before first paint, so a stored dark theme never
 * flashes light. Kept free of "use client" so the server layout gets the string.
 */
export const THEME_STORAGE_KEY = "itinera-theme";

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
