import { useState } from 'react'
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  ShieldCheck,
  Crown,
  BadgePercent,
  Wallet,
  Calculator,
  Truck,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Clock3,
  ClipboardCheck,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'

type MenuSection = {
  title: string
  icon: typeof Store
  items: string[]
}

const sections: MenuSection[] = [
  {
    title: 'لوحة القيادة',
    icon: LayoutDashboard,
    items: [
      'نظرة عامة',
      'إحصائيات المتجر',
      'التنبيهات',
      'سجل النشاط',
    ],
  },
  {
    title: 'المنتجات والمخزون',
    icon: Package,
    items: [
      'جميع المنتجات',
      'إضافة منتج',
      'المنتجات بانتظار الموافقة',
      'الفئات والمقاسات والألوان',
      'المخزون والموردون',
    ],
  },
  {
    title: 'البائعون والاشتراكات',
    icon: Store,
    items: [
      'جميع البائعين',
      'طلبات تسجيل البائعين',
      'التحقق والموافقة',
      'TEO SELLER PLUS',
      'العمولات ومستحقات البائعين',
    ],
  },
  {
    title: 'الطلبات والعملاء',
    icon: ShoppingCart,
    items: [
      'جميع الطلبات',
      'الطلبات الجديدة',
      'المدفوعات والإيصالات',
      'المرتجعات والنزاعات',
      'حسابات العملاء',
    ],
  },
  {
    title: 'TEO DEALS',
    icon: BadgePercent,
    items: [
      'TEO FLASH',
      'TEO FREE DAY',
      'TEO GOLDEN DAYS',
      'TEO COMBO',
      'الكوبونات والهدايا',
      'النقاط والولاء',
    ],
  },
  {
    title: 'المحاسبة والتقارير',
    icon: Calculator,
    items: [
      'لوحة المحاسبة',
      'الإيرادات والمصاريف',
      'الأرباح والخسائر',
      'الدفعات والمتبقي',
      'الفواتير',
      'Sheets وExcel',
    ],
  },
  {
    title: 'التوصيل والخرائط',
    icon: Truck,
    items: [
      'TEO SMART DELIVERY',
      'Google Maps',
      'أسعار الكيلومتر',
      'مناطق التوصيل',
      'شركات التوصيل',
    ],
  },
  {
    title: 'إعدادات المتجر',
    icon: Settings,
    items: [
      'معلومات المتجر',
      'الصور والبنرات',
      'Bankily / Masrvi / Sedad',
      'الموظفون والصلاحيات',
      'الأمان',
    ],
  },
]

const quickActions = [
  {
    title: 'مراجعة المنتجات',
    description: 'قبول أو رفض منتجات البائعين',
    icon: ClipboardCheck,
  },
  {
    title: 'إدارة البائعين',
    description: 'الحسابات والاشتراكات والصلاحيات',
    icon: Users,
  },
  {
    title: 'TEO SELLER PLUS',
    description: 'خطط الاشتراك وتفعيل البائعين',
    icon: Crown,
  },
  {
    title: 'TEO DEALS',
    description: 'العروض والخصومات والحملات',
    icon: BadgePercent,
  },
  {
    title: 'المحاسبة',
    description: 'المبيعات والأرباح والمصاريف',
    icon: FileSpreadsheet,
  },
  {
    title: 'التوصيل الذكي',
    description: 'الخرائط والأسعار والمسافات',
    icon: MapPin,
  },
]

export default function BoutiqueAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState(0)
  const [selectedItem, setSelectedItem] = useState('نظرة عامة')

  const selectItem = (item: string) => {
    setSelectedItem(item)
    setSidebarOpen(false)
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-[#0f172a] text-white transition-transform lg:translate-x-0 ${
          sidebarOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-400 p-3 text-slate-950">
              <Store size={23} />
            </div>

            <div>
              <h1 className="text-base font-black">
                BOUTIQUE TEO
              </h1>
              <p className="mt-1 text-[10px] tracking-widest text-slate-400">
                COMMERCE CENTER
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {sections.map((section, index) => {
            const Icon = section.icon
            const isExpanded = expandedSection === index

            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSection(
                      isExpanded ? -1 : index
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm transition ${
                    isExpanded
                      ? 'bg-white/10 text-amber-300'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={19} />

                  <span className="flex-1 font-semibold">
                    {section.title}
                  </span>

                  {isExpanded ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 space-y-1 pr-5">
                    {section.items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectItem(item)}
                        className={`block w-full rounded-lg px-4 py-2.5 text-right text-xs transition ${
                          selectedItem === item
                            ? 'bg-amber-400 font-bold text-slate-950'
                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <ShieldCheck
              size={21}
              className="text-amber-400"
            />

            <div>
              <p className="text-xs font-bold">
                إدارة TEO STORE
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                مركز التحكم الرئيسي
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:mr-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة"
              className="rounded-xl border border-slate-200 p-2 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-xs font-bold text-amber-700">
                TEO COMMERCE CENTER
              </p>

              <h2 className="mt-1 text-lg font-black">
                {selectedItem}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 sm:inline-flex">
              وضع التجهيز
            </span>

            <span
              aria-label="الإشعارات ستتوفر لاحقًا"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600"
            >
              <Bell size={19} />
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
          <section className="overflow-hidden rounded-3xl bg-[#0f172a] p-7 text-white sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-amber-400">
                  BOUTIQUE TEO ADMIN
                </p>

                <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                  مرحبًا بك في مركز إدارة المتجر
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-8 text-slate-300">
                  من هنا ستدير المنتجات والبائعين
                  والاشتراكات والطلبات والعروض
                  والمحاسبة والتوصيل الذكي.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <LayoutDashboard
                  size={44}
                  className="text-amber-400"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center gap-3">
              <BarChart3
                size={23}
                className="text-amber-700"
              />

              <h3 className="text-xl font-black">
                مؤشرات المتجر
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'إجمالي المبيعات',
                  icon: Wallet,
                },
                {
                  label: 'الطلبات الجديدة',
                  icon: ShoppingCart,
                },
                {
                  label: 'المنتجات قيد المراجعة',
                  icon: Clock3,
                },
                {
                  label: 'البائعون النشطون',
                  icon: Store,
                },
              ].map((stat) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-500">
                        {stat.label}
                      </span>

                      <Icon
                        size={22}
                        className="text-amber-700"
                      />
                    </div>

                    <p className="mt-5 text-2xl font-black text-slate-400">
                      —
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      بانتظار ربط البيانات
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-5 text-xl font-black">
              الوصول السريع
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon

                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => selectItem(action.title)}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-right transition hover:border-amber-400 hover:shadow-md"
                  >
                    <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                      <Icon size={24} />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-black">
                        {action.title}
                      </h4>

                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {action.description}
                      </p>

                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                        عرض القسم
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <MapPin
                size={23}
                className="shrink-0 text-amber-700"
              />

              <div>
                <h3 className="font-black text-amber-950">
                  إعدادات TEO SMART DELIVERY
                </h3>

                <p className="mt-3 text-sm leading-7 text-amber-900">
                  الحد الأدنى المعتمد للتوصيل:
                  <strong> 100 أوقية جديدة </strong>
                  مهما كانت التكلفة المحسوبة أقل من ذلك.
                  سنجعل هذا المبلغ قابلًا للتغيير من
                  إعدادات التوصيل بعد ربط قاعدة البيانات.
                </p>
              </div>
            </div>
          </section>

          {selectedItem !== 'نظرة عامة' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <Settings
                  size={22}
                  className="text-amber-700"
                />

                <h3 className="text-lg font-black">
                  {selectedItem}
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                تم تحديد هذا القسم. سنضيف وظائفه
                الفعلية وربطه بقاعدة البيانات
                في الخطوات القادمة.
              </p>
            </section>
          )}

          <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            TEO STORE · BOUTIQUE TEO · COMMERCE CENTER
          </footer>
        </main>
      </div>
    </div>
  )
}