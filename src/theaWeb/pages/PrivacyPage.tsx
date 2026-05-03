import React from 'react';

import { LegalPage } from './LegalPage';

const PrivacyPage: React.FC = () => (
  <LegalPage title="Privacy Policy" effectiveDate="March 12, 2026">
    <p>
      Thea ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
      explains how we collect, use, and protect your information.
    </p>

    <h2>1. Information We Collect</h2>
    <p>We may collect the following types of information:</p>
    <ul>
      <li>
        <strong>Personal Information:</strong> When you create an account or join our waitlist, we
        may collect your name and email address.
      </li>
      <li>
        <strong>Usage Data:</strong> We collect information about how you use our service,
        including pages visited, links clicked, and device details.
      </li>
      <li>
        <strong>Cookies and Tracking Technologies:</strong> We may use cookies and similar
        technologies to improve your experience and analyze how you use our service. You can
        adjust your cookie preferences in your browser settings.
      </li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use your information to:</p>
    <ul>
      <li>Provide and improve our services.</li>
      <li>Personalize your experience on our platform.</li>
      <li>
        Send you updates about Thea, including new gift guides and product launches. You can
        unsubscribe at any time.
      </li>
      <li>Analyze site traffic and engagement to improve our content.</li>
      <li>Ensure security and prevent fraud.</li>
    </ul>

    <h2>3. Affiliate Links</h2>
    <p>
      Our gift guides contain affiliate links to third-party retailer websites. When you click
      these links, the retailer may collect information about your visit in accordance with their
      own privacy policies. We may receive information about whether a purchase was made, but we
      do not receive your payment details or personal information from the retailer.
    </p>

    <h2>4. How We Share Your Information</h2>
    <p>We do not sell your personal information. We may share your information:</p>
    <ul>
      <li>
        With third-party service providers who help us operate our services, such as email
        platforms and analytics tools.
      </li>
      <li>With affiliate networks that track purchases made through links on our site.</li>
      <li>When required by law or to protect our rights.</li>
      <li>
        In connection with a merger, acquisition, or asset sale, where your information may be
        transferred.
      </li>
    </ul>

    <h2>5. Your Rights and Choices</h2>
    <p>You may:</p>
    <ul>
      <li>
        Request access to or deletion of your personal information by contacting us at{' '}
        <a href="mailto:hello@givethea.com">hello@givethea.com</a>.
      </li>
      <li>
        Opt out of marketing emails at any time by following the unsubscribe link in our emails.
      </li>
      <li>Disable cookies through your browser settings.</li>
    </ul>

    <h2>6. Data Security</h2>
    <p>
      We use appropriate security measures to protect your information. However, no online system
      is 100% secure, so we cannot guarantee absolute security.
    </p>

    <h2>7. Children's Privacy</h2>
    <p>
      Our services are not intended for children under 13, and we do not knowingly collect
      information from children under 13.
    </p>

    <h2>8. Changes to This Privacy Policy</h2>
    <p>
      We may update this Privacy Policy periodically. We will notify you of any significant
      changes by posting the updated policy on this page.
    </p>

    <h2>9. Contact Us</h2>
    <p>
      If you have any questions about this Privacy Policy, please contact us at{' '}
      <a href="mailto:hello@givethea.com">hello@givethea.com</a>.
    </p>
  </LegalPage>
);

export default PrivacyPage;
