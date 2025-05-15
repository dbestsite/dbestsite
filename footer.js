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
      <p>Your privacy is important to us.</p>
      <p><b>BY USING OUR SITE, YOU AGREE TO THE FOLLOWING PRIVACY POLICY:</b></p>
      <p>We use cookies only to improve your browsing experience.</p>
      <p>We collect the data you input when you rate any of our videos as part of keeping up our services.</p>
      <br>
      <p>Overall, we do not collect personal data (i.e. name, address, email, etc.) without your consent unless you reach us through our contact information.</p>
    `,
    "About Us": `
      <h2>About Us</h2>
      <p><b>D' Best Site</b> publishes a collection of adult videos from random individuals online. These videos are primarily, but not limited to, Gay and Solo Porns. Videos here are published publicly by their respective original owners and that we do not filmed them secretly. Videos here are 100% NOT our own and only belongs to their respective owners.</p>
      <p>If you think one of the videos uploaded here is yours and wants to take it down, please feel free to navigate to the 'Contact Us' menu for more details.</p>
      <p>Feel free to use our site as your go-to site for adult entertainment. Support us by sharing our site with your friends.</p>
    `,
    "Contact": `
      <h2>Contact Us</h2>
      <p>If you have concerns or inquiries regarding the contents on our site such as: <br>
      &nbsp;&nbsp;a request to take down a content,<br>
      &nbsp;&nbsp;request a proper credit to you/owner,<br>
      &nbsp;&nbsp;advertise your business,<br>
      &nbsp;&nbsp;submit a content, <br>
      &nbsp;&nbsp;donate, or<br> 
      whatever reasons you have, please feel free to reach us at the following contact details.
      </p>
      <ul>
        <li>Email: contact.mainaddr@gmail.com</li>
        <li>Phone: Not available</li>
        <li>Address: Not available</li>
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
