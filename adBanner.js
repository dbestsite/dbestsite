export function insertBannerAd(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // clear

  // Create an iframe to isolate each ad instance
  const iframe = document.createElement('iframe');
  iframe.width = 310;
  iframe.height = 260;
  iframe.style.border = 'none';
  container.appendChild(iframe);

  // Write the ad script inside the iframe
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <script>
      window.atOptions = {
        key: '5a944efcf8c1ae5899ea4d3ccf62e6a1',
        format: 'iframe',
        height: 250,
        width: 300,
        params: {}
      };
    <\/script>
    <script src="//swollenbasis.com/5a944efcf8c1ae5899ea4d3ccf62e6a1/invoke.js" async><\/script>
  `);
  doc.close();
}
