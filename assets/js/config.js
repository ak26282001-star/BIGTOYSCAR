/*
 * Big Toys Customs: site configuration.
 * Everything a non-developer needs to change before launch lives here.
 * See DEPLOYMENT.md for what each value needs to be.
 */
window.BTC_CONFIG = {
  quote: {
    // POST endpoint that receives quote requests as JSON.
    // Works with any endpoint that accepts JSON, e.g. Formspree ("https://formspree.io/f/xxxxxxx"),
    // Getform, Basin, a serverless function, or your own API.
    // Leave empty and the form will NOT pretend to submit: it shows a clear
    // "not available" message with the contact details below.
    endpoint: "",
    // Extra request headers, if your backend needs them (do not put secret keys here; this file is public).
    headers: {},
    timeoutMs: 15000
  },

  // Business contact details. Empty values are hidden from the page.
  contact: {
    email: "",
    phone: "",
    address: "",
    instagram: ""
  },

  // Currency used for estimates and budget ranges.
  currency: { code: "GBP", locale: "en-GB" },

  // Indicative pricing for the configurator, in whole currency units.
  // PLACEHOLDER VALUES: confirm real figures with the studio before launch.
  pricing: {
    base: 0,
    paint:    { obsidian: 6500, platinum: 5200, verde: 7200, ember: 7800, chalk: 5600 },
    wheel:    { monoblock: 3800, mesh: 4200, turbofan: 4600 },
    finish:   { bronze: 0, gunmetal: 0, silver: 0 },
    caliper:  { stock: 0, bronze: 450, red: 450, yellow: 450 },
    stance:   { factory: 0, lowered: 1900 },
    packages: { aero: 3200, tune: 2400, interior: 5800, lighting: 1400, ceramic: 1600 },
    // Shown as "from X to X × rangeFactor"
    rangeFactor: 1.3
  }
};
