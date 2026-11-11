/*
 * Site configuration.
 * Everything a non-developer needs to change before launch lives here.
 * See DEPLOYMENT.md for what each value needs to be.
 */
window.BTC_CONFIG = {
  testDrive: {
    // POST endpoint that receives test-drive requests as JSON.
    // Works with any endpoint that accepts JSON, e.g. Formspree ("https://formspree.io/f/xxxxxxx"),
    // Getform, Basin, a serverless function, or your own API.
    // Leave empty and the form only shows the preview confirmation, which says nothing was sent.
    endpoint: "",
    // Extra request headers, if your backend needs them (do not put secret keys here; this file is public).
    headers: {},
    timeoutMs: 15000
  }
};
