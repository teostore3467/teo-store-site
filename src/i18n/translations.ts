export type Language = 'fr' | 'ar'

export const translations = {
  fr: {
    common: {
      home: 'Accueil',
      digitalServices: 'Services numériques',
      login: 'Connexion',
      register: 'Créer un compte',
      myAccount: 'Mon compte',
      seeAll: 'Voir tout',
      continue: 'Continuer',
      back: 'Retour',
      language: 'FR',
    },

    home: {
      heroBadge: 'TEO STORE — Digital Services',
      heroTitleLine1: 'Tout votre univers',
      heroTitleLine2: 'numérique,',
      heroTitleLine3: 'au même endroit.',
      heroDescription:
        'Abonnements IA, gaming, streaming, logiciels, recharge et services numériques réunis dans une expérience rapide, sécurisée et professionnelle.',
      exploreServices: 'Explorer les services',
      securePayment: 'Paiement sécurisé',
      verifiedProducts: 'Produits vérifiés',
      fastDelivery: 'Livraison digitale rapide',

      popularSectionLabel: 'Services numériques',
      popularSectionTitle: 'Nos services populaires',
      popularSectionDescription:
        'Découvrez une sélection de services numériques populaires disponibles sur TEO STORE.',
      seeAllServices: 'Voir tous les services',
      seeService: 'Voir le service',
    },

    checkout: {
      digitalOrder: 'Commande digitale',
      finalizeOrder: 'Finalisez votre commande',
      finalizeOrderDescription:
        'Vérifiez votre sélection, choisissez votre mode de paiement et suivez les instructions.',

      yourInformation: 'Vos informations',
      contactInformation: 'Informations de contact',
      name: 'Nom',
      phone: 'Téléphone',

      serviceInformation: 'Informations du service',

      paymentMethod: 'Mode de paiement',
      choosePaymentMethod: 'Choisissez votre méthode',
      choose: 'Choisir',
      selected: 'Sélectionné',
      paymentVia: 'Paiement via',
      active: 'Actif',
      paymentNumber: 'Numéro de paiement',
      copy: 'Copier',
      copied: 'Copié ✓',
      sendExactAmount:
        'Envoyez exactement le montant de votre commande à ce numéro.',
      senderNumber: 'Numéro utilisé pour le paiement',
      senderNumberHelp:
        'Entrez le numéro depuis lequel vous avez envoyé le paiement.',

      paymentProof: 'Preuve de paiement',
      paymentProofHelp:
        'Ajoutez une capture du paiement. Cette preuve sera utilisée pour vérifier votre transaction.',
      addScreenshot: 'Ajouter une capture',

      summary: 'Récapitulatif',
      service: 'Service',
      type: 'Type',
      plan: 'Formule',
      payment: 'Paiement',
      total: 'Total',
      singlePayment: 'Paiement unique',

      completeInformation: 'Complétez vos informations',
      completeRequiredInformation:
        'Complétez les informations requises',
      choosePayment: 'Choisissez un paiement',
      enterPaymentNumber:
        'Entrez votre numéro de paiement',
      addPaymentProof:
        'Ajoutez la preuve de paiement',
      confirmPayment: 'Confirmer le paiement',
      sending: 'Envoi en cours...',

      paymentSentForReview:
        'Paiement envoyé pour vérification',
      orderSent: 'Commande envoyée',
      orderNumber: 'Numéro de commande',
      nextStep: 'Prochaine étape',
      trackOrder: 'Suivre ma commande',
      backToServices: 'Retour aux services',
      paymentReview: 'Vérification du paiement',
    },

    order: {
      trackOrder: 'Suivi de votre commande',
      trackOrderDescription:
        'Suivez ici chaque étape de votre commande TEO STORE.',
      paymentUnderReview: 'Paiement en vérification',
      order: 'Commande',
      orderStatus: 'État de la commande',
      paymentSent: 'Paiement envoyé',
      paymentSentDescription:
        'Votre preuve de paiement a été reçue.',
      paymentVerification: 'Vérification du paiement',
      inProgress: 'En cours',
      paymentVerificationDescription:
        "L'Admin vérifie le paiement et les informations envoyées.",
      serviceProcessing: 'Traitement du service',
      serviceProcessingDescription:
        'Cette étape commencera après confirmation du paiement.',
      orderCompleted: 'Commande terminée',
      orderCompletedDescription:
        "La livraison ou l'activation apparaîtra ici.",
    },

    auth: {
      loginTitle: 'Connexion',
      loginDescription:
        'Connectez-vous pour accéder à vos commandes et à votre compte.',
      email: 'Adresse e-mail',
      password: 'Mot de passe',
      passwordPlaceholder: 'Votre mot de passe',
      forgotPassword: 'Mot de passe oublié ?',
      loginButton: 'Se connecter',
      noAccount: 'Pas encore de compte ?',
      createAccount: 'Créer un compte',

      registerTitle: 'Créer un compte',
      registerDescription:
        'Créez votre compte pour suivre vos commandes et accéder à vos services.',
      fullName: 'Nom complet',
      namePlaceholder: 'Votre nom',
      createPassword: 'Créez un mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      confirmPasswordPlaceholder:
        'Confirmez votre mot de passe',
      createAccountButton: 'Créer mon compte',

      forgotTitle: 'Mot de passe oublié',
      forgotDescription:
        'Saisissez votre adresse e-mail. Nous vous enverrons les instructions pour réinitialiser votre mot de passe.',
      sendInstructions: 'Envoyer les instructions',
      rememberPassword:
        'Vous vous souvenez de votre mot de passe ?',

      resetTitle: 'Nouveau mot de passe',
      resetDescription:
        'Créez un nouveau mot de passe sécurisé pour votre compte.',
      newPassword: 'Nouveau mot de passe',
      newPasswordPlaceholder:
        'Votre nouveau mot de passe',
      confirmNewPasswordPlaceholder:
        'Confirmez le nouveau mot de passe',
      updatePassword:
        'Mettre à jour le mot de passe',
      backToLogin: 'Retour à',
      loginLink: 'la connexion',
    },
  },

  ar: {
    common: {
      home: 'الرئيسية',
      digitalServices: 'الخدمات الرقمية',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      myAccount: 'حسابي',
      seeAll: 'عرض الكل',
      continue: 'متابعة',
      back: 'رجوع',
      language: 'AR',
    },

    home: {
      heroBadge: 'TEO STORE — الخدمات الرقمية',
      heroTitleLine1: 'كل عالمك',
      heroTitleLine2: 'الرقمي،',
      heroTitleLine3: 'في مكان واحد.',
      heroDescription:
        'اشتراكات الذكاء الاصطناعي، الألعاب، البث، البرامج، الشحن والخدمات الرقمية في تجربة سريعة وآمنة واحترافية.',
      exploreServices: 'استكشف الخدمات',
      securePayment: 'دفع آمن',
      verifiedProducts: 'منتجات موثوقة',
      fastDelivery: 'توصيل رقمي سريع',

      popularSectionLabel: 'الخدمات الرقمية',
      popularSectionTitle: 'خدماتنا الأكثر طلبًا',
      popularSectionDescription:
        'اكتشف مجموعة من أشهر الخدمات الرقمية المتوفرة على TEO STORE.',
      seeAllServices: 'عرض كل الخدمات',
      seeService: 'عرض الخدمة',
    },

    checkout: {
      digitalOrder: 'طلب رقمي',
      finalizeOrder: 'أكمل طلبك',
      finalizeOrderDescription:
        'راجع اختيارك، اختر طريقة الدفع واتبع التعليمات.',

      yourInformation: 'معلوماتك',
      contactInformation: 'بيانات التواصل',
      name: 'الاسم',
      phone: 'رقم الهاتف',

      serviceInformation: 'معلومات الخدمة',

      paymentMethod: 'طريقة الدفع',
      choosePaymentMethod: 'اختر طريقة الدفع',
      choose: 'اختيار',
      selected: 'تم الاختيار',
      paymentVia: 'الدفع عبر',
      active: 'مفعّل',
      paymentNumber: 'رقم الدفع',
      copy: 'نسخ',
      copied: 'تم النسخ ✓',
      sendExactAmount:
        'أرسل مبلغ الطلب كاملًا إلى هذا الرقم.',
      senderNumber: 'الرقم المستخدم في الدفع',
      senderNumberHelp:
        'اكتب الرقم الذي أرسلت منه المبلغ.',

      paymentProof: 'إثبات الدفع',
      paymentProofHelp:
        'أضف صورة لعملية الدفع ليتم التحقق منها.',
      addScreenshot: 'إضافة صورة',

      summary: 'ملخص الطلب',
      service: 'الخدمة',
      type: 'النوع',
      plan: 'الخطة',
      payment: 'الدفع',
      total: 'الإجمالي',
      singlePayment: 'دفعة واحدة',

      completeInformation: 'أكمل معلوماتك',
      completeRequiredInformation:
        'أكمل المعلومات المطلوبة',
      choosePayment: 'اختر طريقة الدفع',
      enterPaymentNumber: 'اكتب رقم الدفع',
      addPaymentProof: 'أضف إثبات الدفع',
      confirmPayment: 'تأكيد الدفع',
      sending: 'جاري الإرسال...',

      paymentSentForReview:
        'تم إرسال الدفع للمراجعة',
      orderSent: 'تم إرسال الطلب',
      orderNumber: 'رقم الطلب',
      nextStep: 'الخطوة التالية',
      trackOrder: 'متابعة الطلب',
      backToServices: 'العودة إلى الخدمات',
      paymentReview: 'مراجعة الدفع',
    },

    order: {
      trackOrder: 'متابعة طلبك',
      trackOrderDescription:
        'تابع هنا جميع مراحل طلبك في TEO STORE.',
      paymentUnderReview: 'الدفع قيد المراجعة',
      order: 'الطلب',
      orderStatus: 'حالة الطلب',
      paymentSent: 'تم إرسال الدفع',
      paymentSentDescription:
        'تم استلام إثبات الدفع.',
      paymentVerification: 'التحقق من الدفع',
      inProgress: 'قيد التنفيذ',
      paymentVerificationDescription:
        'يقوم الأدمن بالتحقق من الدفع والمعلومات المرسلة.',
      serviceProcessing: 'تنفيذ الخدمة',
      serviceProcessingDescription:
        'ستبدأ هذه المرحلة بعد تأكيد الدفع.',
      orderCompleted: 'تم إكمال الطلب',
      orderCompletedDescription:
        'سيظهر التسليم أو التفعيل هنا.',
    },

    auth: {
      loginTitle: 'تسجيل الدخول',
      loginDescription:
        'سجّل الدخول للوصول إلى طلباتك وحسابك.',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      passwordPlaceholder: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      loginButton: 'تسجيل الدخول',
      noAccount: 'ليس لديك حساب؟',
      createAccount: 'إنشاء حساب',

      registerTitle: 'إنشاء حساب',
      registerDescription:
        'أنشئ حسابك لمتابعة طلباتك والوصول إلى خدماتك.',
      fullName: 'الاسم الكامل',
      namePlaceholder: 'اسمك الكامل',
      createPassword: 'أنشئ كلمة مرور',
      confirmPassword: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder:
        'أعد إدخال كلمة المرور',
      createAccountButton: 'إنشاء حسابي',

      forgotTitle: 'نسيت كلمة المرور',
      forgotDescription:
        'أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة تعيين كلمة المرور.',
      sendInstructions: 'إرسال التعليمات',
      rememberPassword: 'تذكرت كلمة المرور؟',

      resetTitle: 'كلمة مرور جديدة',
      resetDescription:
        'أنشئ كلمة مرور جديدة وآمنة لحسابك.',
      newPassword: 'كلمة المرور الجديدة',
      newPasswordPlaceholder:
        'أدخل كلمة المرور الجديدة',
      confirmNewPasswordPlaceholder:
        'أعد إدخال كلمة المرور الجديدة',
      updatePassword: 'تحديث كلمة المرور',
      backToLogin: 'العودة إلى',
      loginLink: 'تسجيل الدخول',
    },
  },
} as const