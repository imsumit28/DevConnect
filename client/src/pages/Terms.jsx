import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

const Terms = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to DevConnect ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website, mobile application, and related services (collectively, the "Service"). By accessing or using DevConnect, you agree to be bound by these Terms. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* Use License */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on DevConnect for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Modifying or copying the materials</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Using the materials for any commercial purpose, or for any public display</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Attempting to decompile or reverse engineer any software contained on DevConnect</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Removing any copyright or other proprietary notations from the materials</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Transferring the materials to another person or "mirroring" the materials on any other server</span>
              </li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials on DevConnect are provided on an 'as is' basis. DevConnect makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          {/* Limitations */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Limitations</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall DevConnect or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on DevConnect, even if DevConnect or a DevConnect authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          {/* Accuracy of Materials */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials appearing on DevConnect could include technical, typographical, or photographic errors. DevConnect does not warrant that any of the materials on its website are accurate, complete, or current. DevConnect may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you post content (posts, comments, code snippets, etc.) on DevConnect, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any media or distribution method.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You represent and warrant that you own or have the necessary rights to the content you submit and that your content does not infringe upon any third-party intellectual property rights.
            </p>
          </section>

          {/* Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prohibited Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to engage in any of the following prohibited behavior:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Harassing or causing distress or inconvenience to any person</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Obscene or offensive speech or conduct</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Disrupting the normal flow of dialogue within our platform</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Attempting to gain unauthorized access to our systems</span>
              </li>
              <li className="text-gray-700 flex gap-3">
                <span className="font-semibold">•</span>
                <span>Spam, phishing, or any other malicious activities</span>
              </li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to DevConnect immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              DevConnect may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at ersumitkumar45@gmail.com
            </p>
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

export default Terms;
