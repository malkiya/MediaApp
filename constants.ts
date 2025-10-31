// FIX: Replaced the failing Vite client type reference with a manual declaration
// for `ImportMeta` to correctly type `import.meta.env` and resolve compilation errors.
declare global {
  interface ImportMeta {
    readonly env: {
      // You can define other environment variables here if needed in the future
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

export const WHATSAPP_NUMBERS = ['97333551841']; // Add more numbers here if needed
