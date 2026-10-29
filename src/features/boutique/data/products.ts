export type BoutiqueProduct = {
  id: string
  category: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  price: number
  oldPrice?: number
  image: string
  type: 'stock' | 'preorder'
  stock: number | null
  delivery: string
  deliveryAr: string
  colors: string[]
  colorsAr: string[]
  sizes: string[]
}

export const boutiqueProducts: BoutiqueProduct[] = [
  {
    id: '1',
    category: 'femme',
    name: 'Sac élégant pour femme',
    nameAr: 'حقيبة نسائية أنيقة',
    description: 'Un sac élégant pour vos sorties et votre quotidien.',
    descriptionAr: 'حقيبة نسائية أنيقة مناسبة للخروج والاستخدام اليومي.',
    price: 450,
    oldPrice: 600,
    image: 'https://placehold.co/800x1000/f1e8e1/333333?text=Sac',
    type: 'stock',
    stock: 8,
    delivery: 'Selon votre zone',
    deliveryAr: 'حسب منطقة التوصيل',
    colors: ['Noir', 'Marron'],
    colorsAr: ['أسود', 'بني'],
    sizes: ['Unique'],
  },
  {
    id: '2',
    category: 'homme',
    name: 'Montre homme classique',
    nameAr: 'ساعة رجالية كلاسيكية',
    description: 'Une montre classique au design élégant.',
    descriptionAr: 'ساعة رجالية كلاسيكية بتصميم أنيق.',
    price: 850,
    oldPrice: 1100,
    image: 'https://placehold.co/800x1000/e2e8f0/333333?text=Montre',
    type: 'preorder',
    stock: null,
    delivery: 'Délai à confirmer',
    deliveryAr: 'مدة التوصيل تُحدد عند الطلب',
    colors: ['Noir', 'Argent'],
    colorsAr: ['أسود', 'فضي'],
    sizes: ['Unique'],
  },
  {
    id: '3',
    category: 'maison',
    name: 'Accessoire maison moderne',
    nameAr: 'مستلزمات منزلية عصرية',
    description: 'Un accessoire pratique pour la maison.',
    descriptionAr: 'منتج عملي ومفيد للاستخدام المنزلي.',
    price: 350,
    image: 'https://placehold.co/800x1000/e5e7eb/333333?text=Maison',
    type: 'stock',
    stock: 12,
    delivery: 'Selon votre zone',
    deliveryAr: 'حسب منطقة التوصيل',
    colors: ['Gris'],
    colorsAr: ['رمادي'],
    sizes: ['Unique'],
  },
  {
    id: '4',
    category: 'enfants',
    name: 'Ensemble vêtements enfant',
    nameAr: 'طقم ملابس أطفال',
    description: 'Un ensemble confortable pour enfants.',
    descriptionAr: 'طقم ملابس مريح للأطفال.',
    price: 700,
    oldPrice: 900,
    image: 'https://placehold.co/800x1000/fef3c7/333333?text=Enfants',
    type: 'preorder',
    stock: null,
    delivery: 'Délai à confirmer',
    deliveryAr: 'مدة التوصيل تُحدد عند الطلب',
    colors: ['Bleu', 'Gris'],
    colorsAr: ['أزرق', 'رمادي'],
    sizes: ['2 ans', '4 ans', '6 ans'],
  },
]

export function getBoutiqueProductById(id: string | undefined) {
  return boutiqueProducts.find((product) => product.id === id)
}