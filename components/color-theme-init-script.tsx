/** Runs before paint to reduce accent theme flash (must match lib/color-themes storage key). */
export function ColorThemeInitScript() {
  const js = `(function(){try{var k='admin-color-theme',t=localStorage.getItem(k);if(t&&t!=='zinc')document.documentElement.setAttribute('data-color-theme',t);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
