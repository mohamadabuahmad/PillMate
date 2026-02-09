/**
 * Language Context
 * 
 * Manages app language and internationalization. Supports English (en),
 * Arabic (ar), and Hebrew (he). Provides a translation function (t) to
 * get translated strings. Language preference is persisted to AsyncStorage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'ar' | 'he';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LANGUAGE_STORAGE_KEY = '@pillmate_language';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Menu
    menu: 'Menu',
    home: 'Home',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    
    // Settings
    general: 'General',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy',
    about: 'About',
    
    // Theme
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    
    // Profile
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    name: 'Name',
    email: 'Email',
    save: 'Save',
    cancel: 'Cancel',
    
    // Password
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    
    // Home Page
    hello: 'Hello',
    yourMedications: 'Your Medications',
    nextDose: 'Next Dose',
    noScheduleYet: 'No schedule yet',
    addNewMedication: 'Add New Medication',
    medicationName: 'Medication name',
    medicationNamePlaceholder: 'Medication name (e.g., Aspirin)',
    numberOfPills: 'Number of pills',
    numberOfPillsPlaceholder: 'Number of pills (e.g., 2)',
    time: 'Time',
    addToSchedule: 'Add to Schedule',
    yourSchedule: 'Your Schedule',
    noMedicationsScheduled: 'No medications scheduled yet',
    addOneAbove: 'Add one above to get started',
    editMedication: 'Edit Medication',
    saveChanges: 'Save Changes',
    dispenseDoseNow: 'Dispense Dose Now',
    dispenseBlocked: 'Dispense Blocked',
    findingMedications: 'Finding medications...',
    
    // Chat
    medicationAssistant: 'Medication Assistant',
    iKnowAbout: 'I know about',
    ofYourMedications: 'of your medications',
    aiIsThinking: 'AI is thinking...',
    askAboutMedications: 'Ask about medications, interactions, or schedules...',
    send: 'Send',
    
    // Alerts
    missing: 'Missing',
    enterMedicationName: 'Enter medication name.',
    invalidDose: 'Invalid dose',
    enterValidNumber: 'Enter a valid number of pills.',
    allergyWarning: 'Allergy Warning',
    drugInteractionWarning: 'Drug Interaction Warning',
    timeGapRequired: 'Time Gap Required',
    addAnyway: 'Add Anyway',
    adjustTime: 'Adjust Time',
    deleteMedication: 'Delete Medication',
    areYouSureDelete: 'Are you sure you want to delete',
    delete: 'Delete',
    
    // Common
    close: 'Close',
    ok: 'OK',
  },
  ar: {
    menu: 'القائمة',
    home: 'الرئيسية',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    general: 'عام',
    theme: 'المظهر',
    language: 'اللغة',
    notifications: 'الإشعارات',
    privacy: 'الخصوصية',
    about: 'حول',
    light: 'فاتح',
    dark: 'داكن',
    auto: 'تلقائي',
    editProfile: 'تعديل الملف الشخصي',
    changePassword: 'تغيير كلمة المرور',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    save: 'حفظ',
    cancel: 'إلغاء',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    
    // Home Page
    hello: 'مرحباً',
    yourMedications: 'أدويتك',
    nextDose: 'الجرعة التالية',
    noScheduleYet: 'لا يوجد جدول بعد',
    addNewMedication: 'إضافة دواء جديد',
    medicationName: 'اسم الدواء',
    medicationNamePlaceholder: 'اسم الدواء (مثال: أسبرين)',
    numberOfPills: 'عدد الحبوب',
    numberOfPillsPlaceholder: 'عدد الحبوب (مثال: 2)',
    time: 'الوقت',
    addToSchedule: 'إضافة إلى الجدول',
    yourSchedule: 'جدولك',
    noMedicationsScheduled: 'لا توجد أدوية مجدولة بعد',
    addOneAbove: 'أضف واحداً أعلاه للبدء',
    editMedication: 'تعديل الدواء',
    saveChanges: 'حفظ التغييرات',
    dispenseDoseNow: 'صرف الجرعة الآن',
    dispenseBlocked: 'الصرف محظور',
    findingMedications: 'البحث عن الأدوية...',
    
    // Chat
    medicationAssistant: 'مساعد الأدوية',
    iKnowAbout: 'أعرف عن',
    ofYourMedications: 'من أدويتك',
    aiIsThinking: 'الذكاء الاصطناعي يفكر...',
    askAboutMedications: 'اسأل عن الأدوية والتفاعلات أو الجداول...',
    send: 'إرسال',
    
    // Alerts
    missing: 'مفقود',
    enterMedicationName: 'أدخل اسم الدواء.',
    invalidDose: 'جرعة غير صالحة',
    enterValidNumber: 'أدخل عدداً صالحاً من الحبوب.',
    allergyWarning: 'تحذير من الحساسية',
    drugInteractionWarning: 'تحذير من تفاعل الأدوية',
    timeGapRequired: 'مطلوب فجوة زمنية',
    addAnyway: 'أضف على أي حال',
    adjustTime: 'ضبط الوقت',
    deleteMedication: 'حذف الدواء',
    areYouSureDelete: 'هل أنت متأكد من حذف',
    delete: 'حذف',
    
    close: 'إغلاق',
    ok: 'حسناً',
  },
  he: {
    menu: 'תפריט',
    home: 'בית',
    settings: 'הגדרות',
    profile: 'פרופיל',
    logout: 'התנתק',
    general: 'כללי',
    theme: 'ערכת נושא',
    language: 'שפה',
    notifications: 'התראות',
    privacy: 'פרטיות',
    about: 'אודות',
    light: 'בהיר',
    dark: 'כהה',
    auto: 'אוטומטי',
    editProfile: 'ערוך פרופיל',
    changePassword: 'שנה סיסמה',
    name: 'שם',
    email: 'אימייל',
    save: 'שמור',
    cancel: 'ביטול',
    currentPassword: 'סיסמה נוכחית',
    newPassword: 'סיסמה חדשה',
    confirmPassword: 'אשר סיסמה',
    
    // Home Page
    hello: 'שלום',
    yourMedications: 'התרופות שלך',
    nextDose: 'המנה הבאה',
    noScheduleYet: 'עדיין אין לוח זמנים',
    addNewMedication: 'הוסף תרופה חדשה',
    medicationName: 'שם התרופה',
    medicationNamePlaceholder: 'שם התרופה (לדוגמה: אספירין)',
    numberOfPills: 'מספר כדורים',
    numberOfPillsPlaceholder: 'מספר כדורים (לדוגמה: 2)',
    time: 'זמן',
    addToSchedule: 'הוסף ללוח זמנים',
    yourSchedule: 'לוח הזמנים שלך',
    noMedicationsScheduled: 'עדיין לא נקבעו תרופות',
    addOneAbove: 'הוסף אחד למעלה כדי להתחיל',
    editMedication: 'ערוך תרופה',
    saveChanges: 'שמור שינויים',
    dispenseDoseNow: 'חלק מנה עכשיו',
    dispenseBlocked: 'חלוקה חסומה',
    findingMedications: 'מחפש תרופות...',
    
    // Chat
    medicationAssistant: 'עוזר תרופות',
    iKnowAbout: 'אני יודע על',
    ofYourMedications: 'מהתרופות שלך',
    aiIsThinking: 'הבינה המלאכותית חושבת...',
    askAboutMedications: 'שאל על תרופות, אינטראקציות או לוחות זמנים...',
    send: 'שלח',
    
    // Alerts
    missing: 'חסר',
    enterMedicationName: 'הזן שם תרופה.',
    invalidDose: 'מנה לא תקינה',
    enterValidNumber: 'הזן מספר תקין של כדורים.',
    allergyWarning: 'אזהרת אלרגיה',
    drugInteractionWarning: 'אזהרת אינטראקציה בין תרופות',
    timeGapRequired: 'נדרש פער זמן',
    addAnyway: 'הוסף בכל זאת',
    adjustTime: 'התאם זמן',
    deleteMedication: 'מחק תרופה',
    areYouSureDelete: 'האם אתה בטוח שברצונך למחוק',
    delete: 'מחק',
    
    close: 'סגור',
    ok: 'אישור',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load language from storage on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar' || savedLanguage === 'he')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
      setLanguageState(newLanguage);
    }
  };

  /**
   * Translation function - returns translated string for given key
   * Falls back to the key itself if translation is not found
   * @param key - Translation key
   * @returns Translated string or the key if translation not found
   */
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

