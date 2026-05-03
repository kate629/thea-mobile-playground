import React from 'react';

import { LegalPage } from './LegalPage';

const TermsPage: React.FC = () => (
  <LegalPage title="Terms of Use" effectiveDate="March 12, 2026">
    <p>
      Welcome to Thea. By accessing or using our service, you agree to comply with these Terms of
      Use. Please read them carefully.
    </p>

    <h2>1. Acceptance of Terms</h2>
    <p>
      By accessing Thea, you agree to be bound by these terms. If you do not agree, please do not
      use our services.
    </p>

    <h2>2. Use of Services</h2>
    <p>
      You may use our services only for lawful purposes and in accordance with these Terms. You
      agree not to use the service in any way that violates local, state, national, or
      international law; to transmit or distribute any malicious, abusive, or unlawful material;
      or to engage in any activity that interferes with or disrupts the service.
    </p>

    <h2>3. User Accounts</h2>
    <p>
      You may need to create an account to access certain features. You are responsible for
      maintaining the confidentiality of your account and for all activities that occur under your
      account.
    </p>

    <h2>4. Intellectual Property</h2>
    <p>
      All content and materials on Thea are protected by intellectual property laws and are the
      property of Thea or its licensors. This includes but is not limited to curated product
      selections, editorial content, carousel names, gift guide organization, and site design. You
      may not copy, modify, distribute, or sell any content from our service without permission.
    </p>

    <h2>5. Affiliate Links and Third-Party Products</h2>
    <p>
      Thea participates in affiliate programs. When you click links on our site and make a
      purchase, we may earn a commission at no additional cost to you. This does not influence our
      editorial selections.
    </p>
    <p>
      Thea provides links to third-party retailer websites. We are not responsible for the
      products, pricing, availability, or fulfillment of items purchased through these links. All
      purchases are made directly with the retailer.
    </p>

    <h2>6. Privacy</h2>
    <p>
      Our Privacy Policy describes how we collect, use, and protect your personal information. By
      using our service, you agree to our collection and use of information as outlined in the
      Privacy Policy.
    </p>

    <h2>7. Limitation of Liability</h2>
    <p>
      To the fullest extent permitted by law, Thea shall not be liable for any indirect,
      incidental, or consequential damages arising out of your use or inability to use the
      service, including but not limited to any issues with products purchased through third-party
      retailer links on our site.
    </p>

    <h2>8. Termination</h2>
    <p>
      We reserve the right to suspend or terminate your access to the service at our discretion,
      without notice, if you violate these Terms or engage in harmful activities.
    </p>

    <h2>9. Changes to Terms</h2>
    <p>
      We may update these Terms from time to time. Any changes will be posted on this page, and by
      continuing to use the service, you agree to the revised Terms.
    </p>

    <h2>10. Governing Law</h2>
    <p>These Terms shall be governed by the laws of the State of Tennessee.</p>

    <h2>Contact Us</h2>
    <p>
      For any questions regarding these Terms, please contact us at{' '}
      <a href="mailto:hello@givethea.com">hello@givethea.com</a>.
    </p>
  </LegalPage>
);

export default TermsPage;
