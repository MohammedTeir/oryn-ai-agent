export const strings = {
  en: {
    title: 'Milestone 0 — observation-only debug harness',
    scope: 'This screen only observes metadata. A separate experimental Strict-only native probe API is under review and has no controls on this screen. Termux detection does not prove readiness. An embedded Termux runtime is not implemented.',
    observe: 'Observe Android through Kotlin',
    unknown: 'Unknown — no observation yet',
    checking: 'Checking…',
    error: 'Native observation failed',
  },
  ar: {
    title: 'المرحلة صفر — تطبيق تجريبي للملاحظة فقط',
    scope: 'تعرض هذه الشاشة معلومات النظام فقط. واجهة اختبار أصلية تجريبية بتفويض صارم قيد المراجعة ولا توجد أزرار لها هنا. اكتشاف Termux لا يثبت جاهزيته. بيئة Termux المضمنة غير مطبقة.',
    observe: 'قراءة معلومات أندرويد عبر Kotlin',
    unknown: 'غير معروف — لم تتم الملاحظة بعد',
    checking: 'جارٍ الفحص…',
    error: 'فشلت الملاحظة الأصلية',
  },
} as const;
