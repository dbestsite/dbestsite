// adBanner.js
export function insertBannerAd(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear any existing content
  container.innerHTML = '';

  // Insert the ad script with config
  window.atOptions = {
    key: '5a944efcf8c1ae5899ea4d3ccf62e6a1',
    format: 'iframe',
    height: 250,
    width: 300,
    params: {}
  };

  // Create the script element to load the ad
  const script = document.createElement('script');
  script.src = '//swollenbasis.com/5a944efcf8c1ae5899ea4d3ccf62e6a1/invoke.js';
  script.async = true;

  container.appendChild(script);
}
