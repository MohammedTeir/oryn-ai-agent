export const strings = {
  en: {
    title: 'Milestone 0 — observation-only debug harness',
    scope: 'No commands execute. Termux detection does not prove readiness. Native authorization and embedded runtime are not implemented.',
    observe: 'Observe Android through Kotlin',
    unknown: 'Unknown — no observation yet',
    checking: 'Checking…',
    error: 'Native observation failed',
  },
  ar: {
    title: 'المرحلة صفر — تطبيق تجريبي للملاحظة فقط',
    scope: 'لا يتم تنفيذ أوامر. اكتشاف Termux لا يثبت جاهزيته. التفويض الأصلي وبيئة التشغيل المضمنة غير مطبقين.',
    observe: 'قراءة معلومات أندرويد عبر Kotlin',
    unknown: 'غير معروف — لم تتم الملاحظة بعد',
    checking: 'جارٍ الفحص…',
    error: 'فشلت الملاحظة الأصلية',
  },
} as const;
