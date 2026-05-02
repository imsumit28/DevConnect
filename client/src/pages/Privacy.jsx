import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/register" className="inline-flex items-center gap-2 text-[#0073b1] font-semibold hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to signup
          </Link>
          <div className="mb-6">
            <Logo size="large" clickable={false} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              DevConnect ("Company," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and application. Please read this privacy policy carefully.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Information You Provide</h3>
                <ul className="space-y-2 ml-6">
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Account Information: Name, email address, username, password, bio, location, and profile picture</span>
                  </li>
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Profile Information: Skills, experience level, tech stack, and interests</span>
                  </li>
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Content: Posts, comments, messages, and code snippets you share</span>
                  </li>
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Communication: Emails and messages you send through the platform</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Information Collected Automatically</h3>
                <ul className="space-y-2 ml-6">
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Device Information: Browser type, operating system, and device identifiers</span>
                  </li>
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Usage Data: Pages visited, time spent, and interactions with features</span>
                  </li>
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>IP Address and Location: Approximate location based on IP address</span>
                  </li>
                  <li className="text-gray-700 flex gap-3">
                    <span className="font-semibold">•</span>
                    <span>Cookies and Tracking Technologies: For session management and analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect for the following purposes:</p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Providing and maintaining our Service</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Creating and managing your account</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Connecting developers and facilitating collaboration</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Sending administrative information and updates</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Responding to your inquiries and providing customer support</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Analyzing usage patterns to improve our Service</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Preventing fraud and ensuring security</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Complying with legal obligations</span>
              </li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. However, we may share information in the following circumstances:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span><strong>With Other Users:</strong> Your public profile information is visible to other users</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span><strong>Service Providers:</strong> Third-party vendors who assist us in operating our platform</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span><strong>Legal Requirements:</strong> When required by law or to protect our rights</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</span>
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Access the personal information we hold about you</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Request correction of inaccurate information</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Request deletion of your account and associated data</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Opt-out of marketing communications</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Download a copy of your data in a portable format</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us using the information provided in the Contact Us section.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Similar Technologies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on DevConnect. Cookies help us remember your preferences and understand how you use our platform. You can control cookie settings through your browser, though this may affect your ability to use certain features.
            </p>
          </section>

          {/* Children Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              DevConnect is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will delete such information immediately.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete your personal data within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed">
              DevConnect may contain links to third-party websites and services. This privacy policy applies only to information collected through our platform. We are not responsible for the privacy practices of third-party websites. Please review their privacy policies before sharing information with them.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of significant changes by posting the updated policy on our platform and updating the "Last updated" date. Your continued use of DevConnect constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> ersumitkumar45@gmail.com</p>
              <p className="text-gray-700 mt-2"><strong>Location:</strong> India</p>
            </div>
          </section>

          {/* Footer */}
          <section className="border-t pt-6 mt-6">
            <p className="text-gray-600 text-sm">
              <span className="font-semibold">Made by Sumit Kumar</span> — Student Developer
            </p>
            <p className="text-gray-500 text-xs mt-1">
              DevConnect: Connect with developers. Build your network. Share code. Collaborate.
            </p>
          </section>
        </div>

        {/* Footer Action */}
        <div className="mt-8 flex gap-4">
          <Link
            to="/register"
            className="flex-1 px-6 py-3 bg-[#0073b1] text-white font-semibold rounded-lg hover:bg-[#005f92] transition-colors text-center"
          >
            I Accept & Continue
          </Link>
          <Link
            to="/register"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
