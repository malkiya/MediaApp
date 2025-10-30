// FIX: Replaced the failing Vite client type reference with a manual declaration
// for `ImportMeta` to correctly type `import.meta.env` and resolve compilation errors.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GOOGLE_API_KEY?: string;
      readonly VITE_GOOGLE_CLIENT_ID?: string;
    };
  }
}

export const COMMITTEE_NAMES = [
  "اللجنة الاجتماعية",
  "لجنة الأنشطة",
  "اللجنة المالية",
  "اللجنة الثقافية",
  "لجنة العلاقات العامة",
  "لجنة المشاريع",
  "لجنة دعم الطالب",
  "لجنة تنمية المجتمع",
  "لجنة التحصيل",
  "لجنة أخرى (يرجى التحديد في الملاحظات)"
];

export const COVERAGE_TYPES = [
  "تصوير فوتوغرافي",
  "تصوير فيديو",
  "منشور إنستغرام",
  "بث مباشر",
  "تقرير إخباري"
];

export const TARGET_EMAIL = 'malkiya.cs@gmail.com';
export const WHATSAPP_NUMBERS = ['97333551841'];

// --- ملاحظة هامة للمطور ---
// لإرسال البريد الإلكتروني، يجب عليك إعداد "متغيرات البيئة" (Environment Variables)
// في خدمة الاستضافة الخاصة بك (مثل Vercel أو Netlify).
// قم بإضافة المتغيرات التالية في إعدادات مشروعك على منصة الاستضافة:
// VITE_GOOGLE_API_KEY = [المفتاح الخاص بك هنا]
// VITE_GOOGLE_CLIENT_ID = [معرف العميل الخاص بك هنا]
//
// لا تضع المفاتيح الحقيقية مباشرة في هذا الملف لحماية حسابك.
// Vite يتطلب أن تبدأ أسماء المتغيرات بـ `VITE_` لتكون متاحة في التطبيق.
export const GOOGLE_API_KEY = import.meta.env?.VITE_GOOGLE_API_KEY ?? '';
export const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? '';