
import React from 'react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface NostrExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

const NostrExtensionModal: React.FC<NostrExtensionModalProps> = ({ isOpen, onClose, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-[#01013C] mb-4">
          Nostr Extension Required
        </h2>
        <p className="text-gray-600 mb-6">
          To use Synvya, you need to install a Nostr browser extension like nos2x or Alby.
          These extensions provide secure access to your Nostr identity.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">nos2x</span>
            <a
              href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#49BB5B] hover:underline"
            >
              Install
            </a>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Alby</span>
            <a
              href="https://chrome.google.com/webstore/detail/alby/iokeahhehimjnekafflcihljlcjccdbe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#49BB5B] hover:underline"
            >
              Install
            </a>
          </div>
        </div>

        <div className="flex space-x-3">
          <SecondaryButton onClick={onClose} className="flex-1">
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={onRetry} className="flex-1">
            Try Again
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default NostrExtensionModal;
