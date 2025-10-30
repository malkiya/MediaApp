
import React from 'react';

interface SuccessNotificationProps {
  onClose: () => void;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all scale-100 opacity-100">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-5">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الإرسال بنجاح!</h3>
        <p className="text-gray-600 text-lg">
          شكرًا لتعاونكم مع اللجنة الإعلامية 🌸
        </p>
        <p className="text-gray-500 mt-4 text-sm">
          سيتم التواصل معكم قريبًا لتأكيد التغطية.
        </p>
        <button
          onClick={onClose}
          className="mt-8 w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-transform transform hover:scale-105"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default SuccessNotification;
