import React, { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FormData } from './types';
import { COMMITTEE_NAMES, COVERAGE_TYPES, WHATSAPP_NUMBERS } from './constants';
import Header from './components/Header';
import SuccessNotification from './components/SuccessNotification';

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

  const formatWhatsappMessage = (): string => {
    return `
طلب تغطية إعلامية جديد 📝
----------------------------------
*اسم اللجنة:* ${formData.committeeName}
*مقدم الطلب:* ${formData.applicantName}
*رقم التواصل:* ${formData.contactPhone}
----------------------------------
*اسم الفعالية:* ${formData.eventName}
*التاريخ:* ${formData.eventDate}
----------------------------------
*ملاحظة:* تفاصيل الطلب الكاملة موجودة في ملف PDF المرفق.
`;
  };

  const generatePdfBlob = async (): Promise<Blob> => {
    const reportElement = document.getElementById('pdf-content');
    if (!reportElement) {
      throw new Error("Could not find element to generate PDF from.");
    }

    const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    const imgWidth = pdfWidth - 20; // with margin
    const imgHeight = imgWidth / ratio;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    return pdf.output('blob');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // 1. Generate PDF from the hidden div
      const pdfBlob = await generatePdfBlob();
      
      // 2. Create a download link and trigger the download for the user
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `طلب_تغطية_${formData.eventName || 'فعالية'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(pdfUrl);
      a.remove();
      
      // 3. Prepare WhatsApp message and open link
      const message = formatWhatsappMessage();
      const encodedMessage = encodeURIComponent(message);
      
      // Open link for the first number to avoid multiple popups
      const whatsappLink = `https://wa.me/${WHATSAPP_NUMBERS[0]}?text=${encodedMessage}`;
      window.open(whatsappLink, '_blank');

      // 4. Show success notification
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error during submit process:", error);
      alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData(initialState);
    setIsSubmitted(false);
  }

  return (
    <div className="bg-green-50 min-h-screen text-gray-800">
      <div id="pdf-content" dir="rtl" className="a4-sheet" style={{ position: 'absolute', left: '-9999px', width: '210mm', minHeight:'297mm', boxSizing:'border-box', overflow:'hidden' }}>
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
                    <h3 className="text-lg font-bold text-green-700 mb-2">معلومات و اضافات اضافية</h3>
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
                <input type="text" id="applicantName" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="الاسم الكامل" dir="auto"/>
                {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">☎ رقم الهاتف للتواصل</label>
                <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="يفضل رقم واتساب"/>
                {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
              </div>
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">🎉 اسم الفعالية</label>
                <input type="text" id="eventName" name="eventName" value={formData.eventName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="مثال: فعالية يوم التطوع" dir="auto"/>
                {errors.eventName && <p className="text-red-500 text-xs mt-1">{errors.eventName}</p>}
              </div>
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">📅 تاريخ الفعالية</label>
                <input type="date" id="eventDate" name="eventDate" value={formData.eventDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate}</p>}
              </div>
               <div>
                <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 mb-1">📍 مكان الفعالية</label>
                <input type="text" id="eventLocation" name="eventLocation" value={formData.eventLocation} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="مثال: قاعة الجمعية" dir="auto"/>
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
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">💬 معلومات و اضافات اضافية</label>
              <textarea id="additionalNotes" name="additionalNotes" rows={4} value={formData.additionalNotes} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="أي تفاصيل أخرى تود إضافتها لفريق الإعلام..." dir="auto"></textarea>
            </div>

            <div className="border-t pt-6 mt-8 flex items-center justify-center">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-transform transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري الإنشاء والإرسال...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>إرسال عبر واتساب وتنزيل نسخة</span>
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
