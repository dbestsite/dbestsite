// footer.js

export function setupFooterPopup() {
  const footerLinks = document.querySelectorAll('footer a');
  const popup = document.createElement('div');
  popup.id = 'footerPopup';
  popup.className = 'footer-popup-overlay';
  popup.style.display = 'none';

  popup.innerHTML = `
    <div class="footer-popup-content">
      <button id="closePopupBtn" class="close-btn">&times;</button>
      <div id="popupDetails" class="popup-details"></div>
    </div>
  `;

  document.body.appendChild(popup);

  const popupDetails = popup.querySelector('#popupDetails');
  const closeBtn = popup.querySelector('#closePopupBtn');

  const detailsContent = {
    "Privacy Policy": `
      <h2>Privacy Policy</h2>
      <p>Your privacy is important to us. We do not collect personal data without your consent. We use cookies only to improve your browsing experience.</p>
      <p>[Add more detailed privacy info here]</p>
    `,
    "Terms of Service": `
      <h2>Terms of Service</h2>
      <p>By using D' Best Site, you agree to our terms and conditions, including respecting copyright laws and not misusing content.</p>
      <p>[Add full terms text here]</p>
    `,
    "Contact": `
      <h2>Contact Us</h2>
      <p>You can reach us at:</p>
      <ul>
        <li>Email: support@dbestsite.com</li>
        <li>Phone: +1 (555) 123-4567</li>
        <li>Address: 123 Green St., Nature City</li>
      </ul>
      <p>We’d love to hear from you!</p>
    `
  };

  footerLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const key = link.textContent.trim();
      popupDetails.innerHTML = detailsContent[key] || '<p>Details not found.</p>';
      popup.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // prevent background scroll
    });
  });

  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    document.body.style.overflow = ''; // re-enable scroll
  });

  // Close popup when clicking outside content
  popup.addEventListener('click', e => {
    if (e.target === popup) {
      popup.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
}
