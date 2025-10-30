import React, { useState, useCallback } from 'react';
import { FormData } from './types';
import { COMMITTEE_NAMES, COVERAGE_TYPES, WHATSAPP_NUMBERS, TARGET_EMAIL, GOOGLE_API_KEY, GOOGLE_CLIENT_ID } from './constants';
import Header from './components/Header';
import SuccessNotification from './components/SuccessNotification';
import SubmissionChoiceModal from './components/SubmissionChoiceModal';

declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
        gapi: any;
    }
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const App: React.FC = () => {
  const initialState: FormData = {
    committeeName: '',
    applicantName: '',
    contactPhone: '',
    eventName: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    eventLocation: '',
    coverageTypes: [],
    additionalNotes: '',
  };

  const [formData, setFormData] = useState<FormData>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const validate = useCallback(() => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.committeeName) newErrors.committeeName = 'اسم اللجنة مطلوب';
    if (!formData.applicantName) newErrors.applicantName = 'اسم مقدم الطلب مطلوب';
    if (!formData.contactPhone) newErrors.contactPhone = 'رقم الهاتف مطلوب';
    if (!formData.eventName) newErrors.eventName = 'اسم الفعالية مطلوب';
    if (!formData.eventDate) newErrors.eventDate = 'تاريخ الفعالية مطلوب';
    if (!formData.startTime) newErrors.startTime = 'وقت البداية مطلوب';
    if (!formData.endTime) newErrors.endTime = 'وقت الانتهاء مطلوب';
    if (!formData.eventLocation) newErrors.eventLocation = 'مكان الفعالية مطلوب';
    if (formData.coverageTypes.length === 0) newErrors.coverageTypes = 'اختر نوعًا واحدًا على الأقل من التغطية';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newCoverageTypes = checked
        ? [...prev.coverageTypes, value]
        : prev.coverageTypes.filter(type => type !== value);
      return { ...prev, coverageTypes: newCoverageTypes };
    });
  };

  const formatMessage = (): string => {
    return `
طلب تغطية إعلامية جديد 📝
----------------------------------
*اسم اللجنة:* ${formData.committeeName}
*مقدم الطلب:* ${formData.applicantName}
*رقم التواصل:* ${formData.contactPhone}
----------------------------------
*اسم الفعالية:* ${formData.eventName}
*التاريخ:* ${formData.eventDate}
*الوقت:* من ${formData.startTime} إلى ${formData.endTime}
*المكان:* ${formData.eventLocation}
----------------------------------
*نوع التغطية المطلوبة:*
- ${formData.coverageTypes.join('\n- ')}
----------------------------------
*ملاحظات إضافية:*
${formData.additionalNotes || 'لا يوجد'}
`;
  };

  const generatePdfBlob = async (): Promise<Blob> => {
    const { jsPDF } = window.jspdf;
    const reportElement = document.getElementById('pdf-content');

    if (!reportElement || !window.html2canvas) {
      throw new Error("PDF generation resources not found!");
    }

    const canvas = await window.html2canvas(reportElement, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const imgWidth = pdfWidth - 20;
    const imgHeight = imgWidth / ratio;
    let finalHeight = imgHeight > pdfHeight - 20 ? pdfHeight - 20 : imgHeight;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, finalHeight);
    return pdf.output('blob');
  };

  const handleWhatsappSubmit = async () => {
    setIsLoading(true);
    setShowChoiceModal(false);

    try {
      const pdfBlob = await generatePdfBlob();
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `طلب_تغطية_${formData.eventName || 'فعالية'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(pdfUrl);
      a.remove();
      
      const message = formatMessage();
      const encodedMessage = encodeURIComponent(message);
      
      WHATSAPP_NUMBERS.forEach(number => {
        const whatsappLink = `https://wa.me/${number}?text=${encodedMessage}`;
        window.open(whatsappLink, '_blank');
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error during WhatsApp submit process:", error);
      alert("حدث خطأ أثناء إنشاء ملف PDF أو إرسال الطلب عبر واتساب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailSubmit = async () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      alert('ميزة إرسال البريد الإلكتروني معطلة حاليًا. يرجى من مسؤول النظام تكوين متغيرات Google API في خدمة الاستضافة.');
      return;
    }
    
    setIsLoading(true);
    setShowChoiceModal(false);

    try {
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/gmail.send',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
          }).then(resolve, reject);
        });
      });

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      const pdfBlob = await generatePdfBlob();
      const pdfBase64 = await blobToBase64(pdfBlob);
      const fileName = `طلب_تغطية_${formData.eventName || 'فعالية'}.pdf`;
      
      const subject = `طلب تغطية إعلامية: ${formData.eventName}`;
      const emailBody = `السلام عليكم ورحمة الله وبركاته،

تحية طيبة وبعد،

تجدون في المرفقات تفاصيل طلب تغطية إعلامية لفعالية: "${formData.eventName}".

مع خالص الشكر والتقدير،
${formData.committeeName} - ${formData.applicantName}`;

      const boundary = 'boundary_boundary';
      const rawMessage = [
        `To: ${TARGET_EMAIL}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'Content-Type: multipart/mixed; boundary="' + boundary + '"',
        '',
        '--' + boundary,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        emailBody,
        '',
        '--' + boundary,
        `Content-Type: application/pdf; name="${fileName}"`,
        `Content-Disposition: attachment; filename="${fileName}"`,
        'Content-Transfer-Encoding: base64',
        '',
        pdfBase64,
        '',
        '--' + boundary + '--'
      ].join('\r\n');

      await window.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_')
        }
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(pdfUrl);
      a.remove();
      
      setIsSubmitted(true);

    } catch (error: any) {
      console.error("Error during Email submit process:", error);
      if (error.error === 'popup_closed_by_user') {
        alert("تم إلغاء عملية تسجيل الدخول. لم يتم إرسال البريد الإلكتروني.");
      } else {
        alert("حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى والتأكد من السماح بالنوافذ المنبثقة.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setShowChoiceModal(true);
  };
  
  const resetForm = () => {
    setFormData(initialState);
    setIsSubmitted(false);
  }

  return (
    <div className="bg-green-50 min-h-screen text-gray-800">
      <div id="pdf-content" dir="rtl" className="a4-sheet" style={{ position: 'absolute', left: '-9999px', width: '210mm', minHeight:'297mm', boxSizing:'border-box' }}>
         <div className="p-8 bg-white" style={{fontFamily: "'Tajawal', sans-serif", direction: 'rtl'}}>
            <header className="flex justify-between items-center border-b-2 pb-4 border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-green-800">طلب تغطية إعلامية</h1>
                    <p className="text-gray-600">جمعية المالكية الخيرية - اللجنة الإعلامية</p>
                </div>
                <img 
                    src="https://i0.wp.com/malkiyacharity.com/wp-content/uploads/2021/06/cropped-logo-1.png?w=348&ssl=1" 
                    alt="Logo"
                    className="h-16"
                />
            </header>
            <main className="mt-8 space-y-6 text-base">
                <div className="space-y-4 bg-green-50/50 p-4 rounded-lg border border-green-100">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div><strong className="text-gray-500">اسم اللجنة:</strong> <p className="font-semibold text-lg">{formData.committeeName}</p></div>
                      <div><strong className="text-gray-500">مقدم الطلب:</strong> <p className="font-semibold text-lg">{formData.applicantName}</p></div>
                    </div>
                     <div><strong className="text-gray-500">رقم التواصل:</strong> <p className="font-semibold text-lg">{formData.contactPhone}</p></div>
                </div>
                 <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-bold text-green-700 mb-4">تفاصيل الفعالية</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div><strong className="text-gray-500">اسم الفعالية:</strong> <p className="font-semibold">{formData.eventName}</p></div>
                        <div><strong className="text-gray-500">تاريخ الفعالية:</strong> <p className="font-semibold">{formData.eventDate}</p></div>
                        <div><strong className="text-gray-500">وقت البداية:</strong> <p className="font-semibold">{formData.startTime}</p></div>
                        <div><strong className="text-gray-500">وقت الانتهاء:</strong> <p className="font-semibold">{formData.endTime}</p></div>
                        <div className="col-span-2"><strong className="text-gray-500">مكان الفعالية:</strong> <p className="font-semibold">{formData.eventLocation}</p></div>
                    </div>
                </div>
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-bold text-green-700 mb-2">نوع التغطية المطلوبة</h3>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        {formData.coverageTypes.map(type => <li key={type}>{type}</li>)}
                    </ul>
                </div>
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-bold text-green-700 mb-2">ملاحظات إضافية</h3>
                    <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md min-h-[50px]">{formData.additionalNotes || 'لا يوجد'}</p>
                </div>
            </main>
            <footer className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
                <p>تم إنشاء هذا الطلب بواسطة نموذج اللجنة الإعلامية الإلكتروني.</p>
                <p>تاريخ الإنشاء: {new Date().toLocaleDateString('ar-BH')}</p>
            </footer>
        </div>
      </div>

      {isSubmitted && <SuccessNotification onClose={resetForm} />}
      <SubmissionChoiceModal 
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onSelectWhatsapp={handleWhatsappSubmit}
        onSelectEmail={handleEmailSubmit}
      />
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <div className="text-center mb-8 bg-green-100/50 border border-green-200 text-green-800 p-4 rounded-lg">
            <h2 className="font-bold text-lg mb-2">🔔 عزيزي رئيس اللجنة،</h2>
            <p>لتسهيل التنسيق الإعلامي بين اللجان، يرجى تعبئة النموذج التالي عند وجود أي فعالية أو اجتماع بحاجة إلى تغطية إعلامية. يرجى تقديم الطلب قبل يومين إلى ثلاثة أيام كحد أقصى من موعد الحدث.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="committeeName" className="block text-sm font-medium text-gray-700 mb-1">🏷 اسم اللجنة</label>
                <select id="committeeName" name="committeeName" value={formData.committeeName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                  <option value="" disabled>اختر اللجنة...</option>
                  {COMMITTEE_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                {errors.committeeName && <p className="text-red-500 text-xs mt-1">{errors.committeeName}</p>}
              </div>
              <div>
                <label htmlFor="applicantName" className="block text-sm font-medium text-gray-700 mb-1">👤 مقدم الطلب</label>
                <input type="text" id="applicantName" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="الاسم الكامل"/>
                {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">☎ رقم الهاتف للتواصل</label>
                <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="يفضل رقم واتساب"/>
                {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
              </div>
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">🎉 اسم الفعالية</label>
                <input type="text" id="eventName" name="eventName" value={formData.eventName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="مثال: فعالية يوم التطوع"/>
                {errors.eventName && <p className="text-red-500 text-xs mt-1">{errors.eventName}</p>}
              </div>
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">📅 تاريخ الفعالية</label>
                <input type="date" id="eventDate" name="eventDate" value={formData.eventDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate}</p>}
              </div>
               <div>
                <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 mb-1">📍 مكان الفعالية</label>
                <input type="text" id="eventLocation" name="eventLocation" value={formData.eventLocation} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="مثال: قاعة الجمعية"/>
                {errors.eventLocation && <p className="text-red-500 text-xs mt-1">{errors.eventLocation}</p>}
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">🕒 وقت البداية</label>
                <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">🕔 وقت الانتهاء</label>
                <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📸 نوع التغطية المطلوبة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {COVERAGE_TYPES.map(type => (
                  <label key={type} className="flex items-center space-x-2 space-x-reverse bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-green-400 transition cursor-pointer">
                    <input type="checkbox" value={type} checked={formData.coverageTypes.includes(type)} onChange={handleCheckboxChange} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                    <span className="text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {errors.coverageTypes && <p className="text-red-500 text-xs mt-1">{errors.coverageTypes}</p>}
            </div>

            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">💬 ملاحظات إضافية</label>
              <textarea id="additionalNotes" name="additionalNotes" rows={4} value={formData.additionalNotes} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="أي تفاصيل أخرى تود إضافتها لفريق الإعلام..."></textarea>
            </div>

            <div className="border-t pt-6 mt-8 flex items-center justify-center">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-transform transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>إرسال الطلب وتنزيل نسخة</span>
                    </>
                  )}
                </button>
              </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;