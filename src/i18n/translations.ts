import type { LanguageCode, VoicePersonaId } from '../types';

export interface VoicePersonaOption {
  id: VoicePersonaId;
  gender: 'female' | 'male';
  portraitUrl: string;
  label: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  sampleLine: Record<LanguageCode, string>;
}

export const VOICE_PERSONAS: VoicePersonaOption[] = [
  {
    id: 'female_soft',
    gender: 'female',
    portraitUrl: '/src/assets/images/companion_female_warm_1795710402231.jpg',
    label: {
      en: 'Soft & Gentle Female',
      ta: 'மென்மையான பெண் குரல்',
      hi: 'कोमल और शांत महिला आवाज़',
    },
    description: {
      en: 'Unhurried, soothing voice ideal for calm mornings and bedtime reminders.',
      ta: 'அமைதியான, இதமான குரல் — காலை மற்றும் இரவு நேர நினைவூட்டல்களுக்கு ஏற்றது.',
      hi: 'धीमी और सुखद आवाज़, सुबह और रात की याद दिलाने के लिए उपयुक्त।',
    },
    sampleLine: {
      en: 'Hello. Take your time. I am right here whenever you would like to talk.',
      ta: 'வணக்கம். அவசரமே இல்லை. நீங்கள் பேச விரும்பும் போதெல்லாம் நான் இங்கே இருக்கிறேன்.',
      hi: 'नमस्ते। आराम से बात कीजिए। जब भी आपका मन हो, मैं यहाँ आपके साथ हूँ।',
    },
  },
  {
    id: 'female_warm',
    gender: 'female',
    portraitUrl: '/src/assets/images/companion_female_warm_1795710402231.jpg',
    label: {
      en: 'Warm & Comforting Female',
      ta: 'அன்பான, ஆறுதலான பெண் குரல்',
      hi: 'स्नेहपूर्ण और आत्मीय महिला आवाज़',
    },
    description: {
      en: 'Warm, caring tone like a thoughtful family companion.',
      ta: 'குடும்ப உறவு போலப் பாசத்துடன் பேசும் இனிமையான குரல்.',
      hi: 'परिवार के सदस्य जैसी अपनत्व भरी और स्नेहशील आवाज़।',
    },
    sampleLine: {
      en: 'Good morning! Did you sleep well? Let us check your medicine and breakfast gently.',
      ta: 'காலை வணக்கம்! இரவு நன்றாகத் தூங்கினீர்களா? உங்கள் மருந்தையும் காலை உணவையும் நிதானமாகப் பார்க்கலாம்.',
      hi: 'सुप्रभात! क्या आपकी नींद अच्छी रही? आइए आराम से आपकी दवाई और नाश्ते के बारे में बात करें।',
    },
  },
  {
    id: 'female_mature',
    gender: 'female',
    portraitUrl: '/src/assets/images/companion_female_warm_1795710402231.jpg',
    label: {
      en: 'Mature & Motherly Female',
      ta: 'முதிர்ந்த, பாசமான பெண் குரல்',
      hi: 'परिपक्व और ममतामयी महिला आवाज़',
    },
    description: {
      en: 'Deeply comforting, patient and dignified elder-care voice with natural pauses.',
      ta: 'முதிர்ச்சியும் கருணையும் நிறைந்த, பொறுமையாக வழிகாட்டும் தாய்மைக் குரல்.',
      hi: 'धैर्य, गरिमा और स्नेह से भरी शांत और परिपक्व आवाज़।',
    },
    sampleLine: {
      en: 'Do not worry about anything at all. We will take each step calmly together.',
      ta: 'எதற்கும் மனதை அலட்டிக் கொள்ளாதீர்கள். நாம் அனைத்தையும் நிதானமாகவும் அன்பாகவும் பார்த்துக் கொள்ளலாம்.',
      hi: 'किसी भी बात की चिंता मत कीजिए। हम हर कदम आराम से और साथ मिलकर संभाल लेंगे।',
    },
  },
  {
    id: 'male_calm',
    gender: 'male',
    portraitUrl: '/src/assets/images/companion_male_calm_1795710402983.jpg',
    label: {
      en: 'Calm & Friendly Male',
      ta: 'அமைதியான நட்பு ஆண் குரல்',
      hi: 'शांत और मित्रवत पुरुष आवाज़',
    },
    description: {
      en: 'Clear, friendly pace for everyday reminders and health summaries.',
      ta: 'தினசரி நினைவூட்டல்கள் மற்றும் உடல்நல விவரங்களுக்குத் தெளிவான நட்புக் குரல்.',
      hi: 'दैनिक याद दिलाने और स्वास्थ्य जानकारी के लिए स्पष्ट और मित्रवत आवाज़।',
    },
    sampleLine: {
      en: 'Hello! I can help you with appointments, rides, or simply share a friendly chat.',
      ta: 'வணக்கம்! மருத்துவ சந்திப்புகள், பயண ஏற்பாடு அல்லது இனிமையான உரையாடலுக்கு நான் உதவுகிறேன்.',
      hi: 'नमस्ते! मैं आपकी डॉक्टर से मिलने, गाड़ी बुक करने या आपसे बात करने में मदद कर सकता हूँ।',
    },
  },
  {
    id: 'male_gentle',
    gender: 'male',
    portraitUrl: '/src/assets/images/companion_male_calm_1795710402983.jpg',
    label: {
      en: 'Gentle & Respectful Male',
      ta: 'இதமான, மரியாதையான ஆண் குரல்',
      hi: 'सौम्य और आदरपूर्ण पुरुष आवाज़',
    },
    description: {
      en: 'Soft-spoken, respectful male companion ideal for unhurried daily conversation.',
      ta: 'மென்மையாகவும் மிகுந்த மரியாதையுடனும் பேசும் அன்பான ஆண் குரல்.',
      hi: 'विनम्र, धीमी और स्नेहशील आवाज़, शांत बातचीत के लिए उपयुक्त।',
    },
    sampleLine: {
      en: 'Good day to you. Please tell me comfortably whenever you need a helping hand.',
      ta: 'நலமாக இருக்கிறீர்களா? உங்களுக்கு எந்த உதவி தேவைப்பட்டாலும் தயங்காமல் என்னிடம் சொல்லுங்கள்.',
      hi: 'आप कैसे हैं? जब भी आपको किसी मदद की ज़रूरत हो, बेझिझक बताइएगा।',
    },
  },
  {
    id: 'male_reassuring',
    gender: 'male',
    portraitUrl: '/src/assets/images/companion_male_calm_1795710402983.jpg',
    label: {
      en: 'Mature & Reassuring Male',
      ta: 'நம்பிக்கையளிக்கும் முதிர்ந்த ஆண் குரல்',
      hi: 'विश्वसनीय और शांत पुरुष आवाज़',
    },
    description: {
      en: 'Steady, grounded voice designed for clear guidance and reassurance.',
      ta: 'தெளிவான வழிகாட்டுதலும் மன அமைதியும் தரும் உறுதியான முதிர்ந்த குரல்.',
      hi: 'स्पष्ट मार्गदर्शन और भरोसे के लिए स्थिर और शांत आवाज़।',
    },
    sampleLine: {
      en: 'Everything is organized calmly for you. Just tell me what you need next.',
      ta: 'உங்களுக்காக அனைத்தும் அமைதியாகத் தயார் செய்யப்பட்டுள்ளன. அடுத்து என்ன வேண்டும் என்று சொல்லுங்கள்.',
      hi: 'आपके लिए सब कुछ आराम से व्यवस्थित है। बस बताइए आपको आगे क्या मदद चाहिए।',
    },
  },
];

export interface TranslationBundle {
  brandTagline: string;
  talkToCompanion: string;
  emergencySos: string;
  switchRole: string;
  nav: {
    home: string;
    health: string;
    appointments: string;
    watch: string;
    transport: string;
    companionship: string;
    opportunities: string;
    reminders: string;
    impact: string;
    settings: string;
  };
  onboarding: {
    badge: string;
    welcomeSpeech: string;
    welcomeSub: string;
    tapToHear: string;
    repeatQuestion: string;
    skipStep: string;
    nextStep: string;
    prevStep: string;
    finishAndOpen: string;
    speakAnswer: string;
    listeningNow: string;
    typePlaceholder: string;
    orUseDemoLakshmi: string;
    questions: {
      name: string;
      language: string;
      voice: string;
      pace: string;
      living: string;
      support: string;
      emergency: string;
    };
    paceSlow: string;
    paceNormal: string;
    livingAlone: string;
    livingFamily: string;
    livingCaregiver: string;
    supportOptions: {
      healthcare: string;
      daily_activities: string;
      transportation: string;
      social_connections: string;
      all: string;
    };
    emergencyNamePlaceholder: string;
    emergencyRelationPlaceholder: string;
    emergencyPhonePlaceholder: string;
    completionSpeech: string;
  };
  dashboard: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    greetingSub: string;
    todaysMedicines: string;
    nextAppointment: string;
    hydrationMeals: string;
    voicesOfLove: string;
    quickActions: string;
    bookRide: string;
    openWatch: string;
    callFamily: string;
    markTaken: string;
    snooze: string;
    missed: string;
    takenLabel: string;
    pendingLabel: string;
    beforeFood: string;
    afterFood: string;
    withFood: string;
    anytime: string;
    addWater: string;
    glassesOfWater: string;
    logMeal: string;
    mealPlaceholder: string;
    saveMeal: string;
    noAppointments: string;
    pendingPrescriptionTitle: string;
    confirmPrescriptionBtn: string;
    declinePrescriptionBtn: string;
    pharmacyTrackerTitle: string;
    dailyHabits: string;
    dailyRoutine: string;
    listenMessage: string;
    listenedLabel: string;
    emergencyContactsTitle: string;
    emergencyContactsSub: string;
    primaryContactLabel: string;
    secondaryContactLabel: string;
    addContactBtn: string;
    editContactBtn: string;
    removeContactBtn: string;
    setPrimaryBtn: string;
    noPrimaryContact: string;
    noSecondaryContact: string;
    emergencyAssistBtn: string;
    manageContactsBtn: string;
    nationalHelplineTitle: string;
  };
  health: {
    title: string;
    subtitle: string;
    conditions: string;
    allergies: string;
    primaryDoctor: string;
    preferredHospital: string;
    medicationSchedule: string;
    addMedicine: string;
    medicineName: string;
    dosage: string;
    time: string;
    medicalReports: string;
    uploadReport: string;
    reportTitle: string;
    reportSummary: string;
    nonDiagnosticNote: string;
  };
  appointments: {
    title: string;
    subtitle: string;
    chooseDoctor: string;
    modeInPerson: string;
    modeTele: string;
    dateLabel: string;
    timeLabel: string;
    reasonLabel: string;
    bookButton: string;
    upcomingTitle: string;
    cancelButton: string;
    demoLabel: string;
  };
  watch: {
    title: string;
    subtitle: string;
    demoBanner: string;
    connectBluetooth: string;
    useDemoWatch: string;
    syncNow: string;
    heartRate: string;
    restingHr: string;
    spo2: string;
    bloodPressure: string;
    bpNote: string;
    stepsToday: string;
    sleepLastNight: string;
    shareDoctor: string;
    trendsTitle: string;
    guidanceNote: string;
  };
  transport: {
    title: string;
    subtitle: string;
    purposeLabel: string;
    pickupLabel: string;
    destinationLabel: string;
    vehicleLabel: string;
    accessiblePref: string;
    bookRideBtn: string;
    recentBookings: string;
    cancelRide: string;
    estFare: string;
    driverLabel: string;
    demoNotice: string;
  };
  companionship: {
    title: string;
    subtitle: string;
    morningCheckIn: string;
    musicSuggestions: string;
    playMusicHint: string;
    memoryTitle: string;
    memorySub: string;
    addMemoryBtn: string;
    deleteBtn: string;
    ngoSupportTitle: string;
    requestVolunteerBtn: string;
  };
  opportunities: {
    title: string;
    subtitle: string;
    scamWarning: string;
    applyBtn: string;
    appliedLabel: string;
  };
  reminders: {
    title: string;
    subtitle: string;
    addReminder: string;
    shoppingTitle: string;
    addItem: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageLabel: string;
    dialectLabel: string;
    dialectSub: string;
    testDialectLabel: string;
    voiceLabel: string;
    listenSample: string;
    speedLabel: string;
    volumeLabel: string;
    fontSizeLabel: string;
    highContrastLabel: string;
    privacyTitle: string;
    exportDataBtn: string;
    reopenOnboardingBtn: string;
    resetDemoBtn: string;
  };
  emergency: {
    title: string;
    subtitle: string;
    confirmPrompt: string;
    consentLocation: string;
    triggerAlertBtn: string;
    honestNotice: string;
    callNow: string;
    indiaNumbersTitle: string;
    trustedContactsTitle: string;
    addContactTitle: string;
    saveContactBtn: string;
    closeBtn: string;
    alertRecorded: string;
  };
  videoCall: {
    title: string;
    connectingSub: string;
    listeningStatus: string;
    thinkingStatus: string;
    speakingStatus: string;
    readyStatus: string;
    tapToSpeak: string;
    stopListening: string;
    continuousMode: string;
    pauseSpeech: string;
    resumeSpeech: string;
    repeatLast: string;
    enableMyCamera: string;
    disableMyCamera: string;
    endCall: string;
    typeMessagePlaceholder: string;
    sendBtn: string;
    confirmAction: string;
    dismissAction: string;
    quickPromptsTitle: string;
    quickPrompts: string[];
    aiDialectMicLabel: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: {
    brandTagline: 'Care That Understands. Companionship That Never Leaves.',
    talkToCompanion: 'Talk to your companion',
    emergencySos: 'Emergency SOS (112)',
    switchRole: 'Switch Role / Login',
    nav: {
      home: 'Home',
      health: 'Healthcare',
      appointments: 'Doctors',
      watch: 'Health Watch',
      transport: 'Transport',
      companionship: 'Companionship',
      opportunities: 'Opportunities',
      reminders: 'Reminders',
      impact: 'Global Impact',
      settings: 'Settings',
    },
    onboarding: {
      badge: 'Welcome to SENIORA',
      welcomeSpeech:
        "Hello! Welcome. I'm here to make your everyday life a little easier. Before we begin, I'd love to know a few things about you. Shall we get started?",
      welcomeSub: 'Take all the time you need. You can speak or type any answer, or skip any question.',
      tapToHear: 'Tap to Hear Welcome',
      repeatQuestion: 'Repeat Question',
      skipStep: 'Skip',
      nextStep: 'Continue',
      prevStep: 'Back',
      finishAndOpen: 'Open My Personal Space',
      speakAnswer: 'Speak Answer',
      listeningNow: 'Listening calmly...',
      typePlaceholder: 'Type your answer here...',
      orUseDemoLakshmi: 'Explore Demo Profile (Lakshmi, 72)',
      questions: {
        name: '1. What would you like us to call you?',
        language: '2. Which language are you most comfortable speaking?',
        voice: '3. Would you prefer a female or male voice? You can listen to a sample first.',
        pace: '4. Would you like me to speak slowly or at a normal pace?',
        living: '5. Do you live alone or with someone?',
        support: '6. Would you like help with healthcare, daily activities, transportation, social connections, or all of them?',
        emergency: '7. Would you like to add an emergency contact?',
      },
      paceSlow: 'Speak Slowly & Clearly (Recommended)',
      paceNormal: 'Speak at Normal Pace',
      livingAlone: 'I live alone',
      livingFamily: 'I live with family',
      livingCaregiver: 'I live with a caregiver',
      supportOptions: {
        healthcare: 'Healthcare & Medicines',
        daily_activities: 'Daily Activities & Meals',
        transportation: 'Transportation',
        social_connections: 'Social & Companionship',
        all: 'All of them',
      },
      emergencyNamePlaceholder: 'Contact name (e.g., Priya or Neighbour)',
      emergencyRelationPlaceholder: 'Relationship (Family / Neighbour)',
      emergencyPhonePlaceholder: 'Phone number (e.g., +91 98450 22334)',
      completionSpeech:
        "Wonderful! I've set everything up according to your preferences. Whenever you need me, just talk to me. Let's take a look at your personal space.",
    },
    dashboard: {
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      greetingSub: 'Everything is arranged gently for your comfort today. Tap Talk to your companion anytime.',
      todaysMedicines: "Today's Medications",
      nextAppointment: 'Upcoming Appointment',
      hydrationMeals: 'Water & Meals Today',
      voicesOfLove: 'Voices of Love (Family)',
      quickActions: 'Quick Care Actions',
      bookRide: 'Book Transport',
      openWatch: 'Health Watch',
      callFamily: 'Call Primary Contact',
      markTaken: 'Taken',
      snooze: 'Snooze',
      missed: 'Missed',
      takenLabel: 'Taken',
      pendingLabel: 'Due Today',
      beforeFood: 'Before food',
      afterFood: 'After food',
      withFood: 'With food',
      anytime: 'Anytime',
      addWater: '+1 Glass Water',
      glassesOfWater: 'glasses today',
      logMeal: 'Log Meal',
      mealPlaceholder: 'What did you eat? (e.g., 2 idlis)',
      saveMeal: 'Save Meal',
      noAppointments: 'No upcoming appointments scheduled.',
      pendingPrescriptionTitle: 'Doctor Prescription Update — Needs Your Confirmation',
      confirmPrescriptionBtn: 'Confirm & Order Medicine (DEMO)',
      declinePrescriptionBtn: 'Ask Doctor to Review',
      pharmacyTrackerTitle: 'Medicine Delivery Tracker (DEMO)',
      dailyHabits: 'Daily Gentle Habits',
      dailyRoutine: 'Daily Routine',
      listenMessage: 'Play Message',
      listenedLabel: 'Listened',
      emergencyContactsTitle: 'Emergency Contacts & Immediate Help',
      emergencyContactsSub: 'Tap Call anytime to reach your trusted contacts immediately.',
      primaryContactLabel: 'Primary Emergency Contact',
      secondaryContactLabel: 'Secondary Emergency Contact',
      addContactBtn: 'Add Contact',
      editContactBtn: 'Edit',
      removeContactBtn: 'Remove',
      setPrimaryBtn: 'Make Primary',
      noPrimaryContact: 'No primary emergency contact added yet.',
      noSecondaryContact: 'No secondary emergency contact added yet.',
      emergencyAssistBtn: 'Emergency Assistance',
      manageContactsBtn: 'Manage All Contacts',
      nationalHelplineTitle: 'National Emergency Helpline',
    },
    health: {
      title: 'Healthcare & Medications',
      subtitle: 'Your health profile, medications, doctor-approved instructions, and reports.',
      conditions: 'Existing Conditions',
      allergies: 'Allergies',
      primaryDoctor: 'Primary Doctor',
      preferredHospital: 'Preferred Hospital',
      medicationSchedule: 'Medication Schedule',
      addMedicine: 'Add Medicine',
      medicineName: 'Medicine name',
      dosage: 'Dosage (e.g., 5 mg)',
      time: 'Time',
      medicalReports: 'Medical Reports',
      uploadReport: 'Upload Report Summary',
      reportTitle: 'Report title',
      reportSummary: 'Summary or lab notes',
      nonDiagnosticNote:
        'SENIORA explains health records in simple words but never diagnoses conditions or changes medications without explicit doctor authorization.',
    },
    appointments: {
      title: 'Doctor Appointments',
      subtitle: 'Book in-person or teleconsultation visits with trusted geriatric & specialist doctors.',
      chooseDoctor: 'Select a Doctor',
      modeInPerson: 'In-Person Visit',
      modeTele: 'Video Teleconsult',
      dateLabel: 'Date',
      timeLabel: 'Time Slot',
      reasonLabel: 'Reason for visit',
      bookButton: 'Confirm Appointment (DEMO)',
      upcomingTitle: 'Your Appointments',
      cancelButton: 'Cancel',
      demoLabel: 'Simulated DEMO booking — verify clinic confirmation before travelling.',
    },
    watch: {
      title: 'HEALTH WATCH',
      subtitle: 'Smartwatch & health monitoring overview.',
      demoBanner: 'DEMO DATA: No physical smartwatch is currently paired. Readings below are simulated demonstration values, not real medical measurements.',
      connectBluetooth: 'Pair Bluetooth Heart-Rate Watch',
      useDemoWatch: 'Use Simulator (DEMO)',
      syncNow: 'Refresh Readings',
      heartRate: 'Heart Rate',
      restingHr: 'Resting HR',
      spo2: 'Oxygen Saturation (SpO2)',
      bloodPressure: 'Blood Pressure (Validated Cuff Only)',
      bpNote: 'Ordinary smartwatches cannot measure BP accurately; requires a validated compatible cuff.',
      stepsToday: 'Daily Steps',
      sleepLastNight: 'Sleep Duration',
      shareDoctor: 'Share readings with Dr. Arjun',
      trendsTitle: '7-Day Health Trends',
      guidanceNote:
        'Unusual readings are highlighted gently for review. Always consult a qualified physician for medical advice; press SOS if you feel chest pain or breathless.',
    },
    transport: {
      title: 'Accessible Transportation',
      subtitle: 'Safe, senior-friendly rides for medical visits, pharmacy trips, and daily errands.',
      purposeLabel: 'Trip Purpose',
      pickupLabel: 'Pickup Location',
      destinationLabel: 'Destination',
      vehicleLabel: 'Preferred Vehicle',
      accessiblePref: 'Prioritize wheelchair / low-step accessible vehicle',
      bookRideBtn: 'Confirm Ride Booking (DEMO)',
      recentBookings: 'Your Ride Bookings',
      cancelRide: 'Cancel Ride',
      estFare: 'Estimated Fare',
      driverLabel: 'Assigned Driver',
      demoNotice: 'DEMO booking integration — do not treat simulated drivers as live dispatched taxis.',
    },
    companionship: {
      title: 'Companionship & Personal Memory',
      subtitle: 'Warm conversations, family voices, favourite music, and community connections.',
      morningCheckIn: 'Gentle Daily Check-in',
      musicSuggestions: 'Music & Story Suggestions',
      playMusicHint: 'Personalized from your memory profile',
      memoryTitle: 'Your Personal Memory Profile',
      memorySub: 'View, add, or remove anything you would like SENIORA to remember or avoid.',
      addMemoryBtn: 'Save Preference',
      deleteBtn: 'Remove',
      ngoSupportTitle: 'NGO Companion & Volunteer Assistance',
      requestVolunteerBtn: 'Request Friendly Volunteer Visit',
    },
    opportunities: {
      title: 'Senior Opportunities & Mentoring',
      subtitle: 'Verified part-time, remote, mentoring, and community roles tailored for older adults.',
      scamWarning: 'Safety Promise: Verified partners only. Never pay registration fees or share bank OTPs.',
      applyBtn: 'Express Interest',
      appliedLabel: 'Application Submitted',
    },
    reminders: {
      title: 'Reminders & Shopping List',
      subtitle: 'Keep track of daily tasks, appointments, water, family birthdays, and groceries.',
      addReminder: 'Add Reminder',
      shoppingTitle: 'Shopping & Errand List',
      addItem: 'Add Item',
    },
    settings: {
      title: 'Language, Voice & Privacy Settings',
      subtitle: 'Adjust speaking speed, volume, text size, regional Tamil dialect, and data-sharing consent anytime.',
      languageLabel: 'Application & Voice Language',
      dialectLabel: 'Tamil Nadu Regional Dialect',
      dialectSub: 'Choose the regional Tamil speech style most natural and comforting to you.',
      testDialectLabel: 'Test Regional Tamil Expressions',
      voiceLabel: 'Companion Voice Persona',
      listenSample: 'Listen to Sample',
      speedLabel: 'Speaking Speed',
      volumeLabel: 'Voice Volume',
      fontSizeLabel: 'Text Size',
      highContrastLabel: 'High Contrast Mode',
      privacyTitle: 'Privacy & Sharing Consent',
      exportDataBtn: 'Export My Data (JSON)',
      reopenOnboardingBtn: 'Revisit Welcome Onboarding',
      resetDemoBtn: 'Reset Demo Dataset',
    },
    emergency: {
      title: 'Emergency Assistance (India)',
      subtitle: 'Confirm before sending alerts or tap any emergency helpline directly.',
      confirmPrompt: 'Do you need emergency help right now?',
      consentLocation: 'Consent to share my home address/location with emergency responders and trusted contacts',
      triggerAlertBtn: 'Confirm & Alert Trusted Contacts (DEMO)',
      honestNotice:
        'Honest Notice: Tapping a number uses your device dialer where supported. In web demo mode, contact alerts are logged to Family & NGO dashboards and do not place live carrier calls automatically.',
      callNow: 'Call',
      indiaNumbersTitle: 'India Emergency Helplines',
      trustedContactsTitle: 'Your Trusted Contacts',
      addContactTitle: 'Add Trusted Contact (Neighbour / Family / Doctor)',
      saveContactBtn: 'Save Contact',
      closeBtn: 'Close',
      alertRecorded: 'Emergency event recorded and visible to authorized Family, NGO, and Doctor dashboards (DEMO).',
    },
    videoCall: {
      title: 'Live Video Companion',
      connectingSub: 'Warm, unhurried live conversation',
      listeningStatus: 'Listening to you...',
      thinkingStatus: 'Thinking gently...',
      speakingStatus: 'Speaking...',
      readyStatus: 'Ready whenever you wish to speak',
      tapToSpeak: 'Tap to Speak',
      stopListening: 'Stop Listening',
      continuousMode: 'Keep Listening',
      pauseSpeech: 'Pause Voice',
      resumeSpeech: 'Resume Voice',
      repeatLast: 'Repeat Last Reply',
      enableMyCamera: 'Turn On My Video',
      disableMyCamera: 'Hide My Video',
      endCall: 'Return to Dashboard',
      typeMessagePlaceholder: 'Or type what you would like to say...',
      sendBtn: 'Send',
      confirmAction: 'Yes, Confirm',
      dismissAction: 'Not Now',
      quickPromptsTitle: 'Try saying:',
      quickPrompts: [
        'I have been experiencing knee pain. I think I need to see a doctor.',
        'I need a vehicle to visit my doctor tomorrow.',
        'Tell me what medicines I need to take today.',
        "I don't feel like eating breakfast today.",
      ],
      aiDialectMicLabel: 'Regional Voice Recognition (AI)',
    },
  },
  ta: {
    brandTagline: 'உங்களைப் புரிந்துகொள்ளும் அக்கறை. எப்போதும் உடன் இருக்கும் துணை.',
    talkToCompanion: 'உங்கள் துணையுடன் பேசுங்கள்',
    emergencySos: 'அவசர உதவி SOS (112)',
    switchRole: 'பங்கு மாற்றம் / உள்நுழைவு',
    nav: {
      home: 'முகப்பு',
      health: 'மருத்துவம்',
      appointments: 'மருத்துவர்கள்',
      watch: 'உடல்நலக் கடிகாரம்',
      transport: 'பயண வசதி',
      companionship: 'தோழமை',
      opportunities: 'வாய்ப்புகள்',
      reminders: 'நினைவூட்டல்கள்',
      impact: 'உலகளாவிய தாக்கம்',
      settings: 'அமைப்புகள்',
    },
    onboarding: {
      badge: 'SENIORA-க்கு நல்வரவு',
      welcomeSpeech:
        'வணக்கம்! நல்வரவு. உங்கள் அன்றாட வாழ்க்கையை இன்னும் எளிதாக்க நான் இங்கே இருக்கிறேன். தொடங்குவதற்கு முன் உங்களைப் பற்றி சில விஷயங்களை அறிய விரும்புகிறேன். தொடங்கலாமா?',
      welcomeSub: 'அவசரப்பட வேண்டாம். நீங்கள் பேசியோ தட்டச்சு செய்தோ பதிலளிக்கலாம் அல்லது தவிர்க்கலாம்.',
      tapToHear: 'வரவேற்புக் குரலைக் கேளுங்கள்',
      repeatQuestion: 'கேள்வியை மீண்டும் கேள்',
      skipStep: 'தவிர்',
      nextStep: 'தொடர்',
      prevStep: 'பின்செல்',
      finishAndOpen: 'என் தனிப்பட்ட இடத்தைத் திற',
      speakAnswer: 'பேசிப் பதிலளி',
      listeningNow: 'அமைதியாகக் கேட்டுக்கொண்டிருக்கிறேன்...',
      typePlaceholder: 'உங்கள் பதிலை இங்கே தட்டச்சு செய்யுங்கள்...',
      orUseDemoLakshmi: 'மாதிரி சுயவிவரத்தைத் திற (லட்சுமி, 72)',
      questions: {
        name: '1. நாங்கள் உங்களை எந்தப் பெயரில் அழைக்க வேண்டும்?',
        language: '2. நீங்கள் எந்த மொழியில் பேச விரும்புகிறீர்கள்?',
        voice: '3. பெண் குரல் வேண்டுமா அல்லது ஆண் குரல் வேண்டுமா? மாதிரி குரலைக் கேட்கலாம்.',
        pace: '4. நான் மெதுவாகப் பேசட்டுமா அல்லது சாதாரண வேகத்தில் பேசட்டுமா?',
        living: '5. நீங்கள் தனியாக வசிக்கிறீர்களா அல்லது குடும்பத்துடன் வசிக்கிறீர்களா?',
        support: '6. மருத்துவம், தினசரி பணிகள், பயணம், சமூகத் தொடர்புகள் — எதில் உதவி தேவை?',
        emergency: '7. அவசரத் தொடர்பு எண்ணைச் சேர்க்க விரும்புகிறீர்களா?',
      },
      paceSlow: 'மெதுவாகவும் தெளிவாகவும் பேசு (பரிந்துரை)',
      paceNormal: 'சாதாரண வேகத்தில் பேசு',
      livingAlone: 'நான் தனியாக வசிக்கிறேன்',
      livingFamily: 'குடும்பத்துடன் வசிக்கிறேன்',
      livingCaregiver: 'பராமரிப்பாளருடன் வசிக்கிறேன்',
      supportOptions: {
        healthcare: 'மருத்துவம் மற்றும் மருந்துகள்',
        daily_activities: 'தினசரி பணிகள் & உணவு',
        transportation: 'பயண வசதி',
        social_connections: 'சமூகத் தொடர்பு & தோழமை',
        all: 'அனைத்திலும் உதவி',
      },
      emergencyNamePlaceholder: 'தொடர்பு பெயர் (எ.கா. பிரியா / அண்டை வீட்டார்)',
      emergencyRelationPlaceholder: 'உறவு (மகள் / அண்டை வீட்டார்)',
      emergencyPhonePlaceholder: 'தொலைபேசி எண் (எ.கா. +91 98450 22334)',
      completionSpeech:
        'மிக நன்று! உங்கள் விருப்பப்படி அனைத்தையும் அமைத்துவிட்டேன். எப்போது தேவைப்பட்டாலும் என்னிடம் பேசுங்கள். இப்போது உங்கள் முகப்பைப் பார்ப்போம்.',
    },
    dashboard: {
      goodMorning: 'காலை வணக்கம்',
      goodAfternoon: 'மதிய வணக்கம்',
      goodEvening: 'மாலை வணக்கம்',
      greetingSub: 'உங்கள் வசதிக்காக இன்று அனைத்தும் தயாராக உள்ளன. எப்போது வேண்டுமானாலும் என்னிடம் பேசுங்கள்.',
      todaysMedicines: 'இன்றைய மருந்துகள்',
      nextAppointment: 'அடுத்த மருத்துவ சந்திப்பு',
      hydrationMeals: 'இன்றைய நீர் & உணவு',
      voicesOfLove: 'அன்பின் குரல்கள் (குடும்பம்)',
      quickActions: 'விரைவு உதவிகள்',
      bookRide: 'வாகனம் முன்பதிவு',
      openWatch: 'நலக் கடிகாரம்',
      callFamily: 'முதன்மைத் தொடர்பை அழை',
      markTaken: 'எடுத்தேன்',
      snooze: 'பிறகு',
      missed: 'தவறியது',
      takenLabel: 'எடுக்கப்பட்டது',
      pendingLabel: 'இன்று எடுக்க வேண்டும்',
      beforeFood: 'உணவுக்கு முன்',
      afterFood: 'உணவுக்குப் பின்',
      withFood: 'உணவுடன்',
      anytime: 'எப்போது வேண்டுமானாலும்',
      addWater: '+1 குவளை நீர்',
      glassesOfWater: 'குவளைகள் இன்று',
      logMeal: 'உணவைப் பதிவு செய்',
      mealPlaceholder: 'என்ன சாப்பிட்டீர்கள்? (எ.கா. 2 இட்லி)',
      saveMeal: 'சேமி',
      noAppointments: 'வரவிருக்கும் சந்திப்புகள் இல்லை.',
      pendingPrescriptionTitle: 'மருத்துவரின் புதிய மருந்துப் பரிந்துரை — உங்கள் ஒப்புதல் தேவை',
      confirmPrescriptionBtn: 'உறுதிசெய்து மருந்து வரவழைக்கவும் (மாதிரி)',
      declinePrescriptionBtn: 'மருத்துவரிடம் மீண்டும் கேட்கவும்',
      pharmacyTrackerTitle: 'மருந்து விநியோக நிலை (மாதிரி)',
      dailyHabits: 'தினசரி நல்ல பழக்கங்கள்',
      dailyRoutine: 'தினசரி அட்டவணை',
      listenMessage: 'குரலைக் கேளுங்கள்',
      listenedLabel: 'கேட்கப்பட்டது',
      emergencyContactsTitle: 'அவசரத் தொடர்புகள் மற்றும் உடனடி உதவி',
      emergencyContactsSub: 'உங்கள் நம்பகமானவர்களை உடனே அழைக்க அழைப்புப் பொத்தானைத் தட்டுங்கள்.',
      primaryContactLabel: 'முதன்மை அவசரத் தொடர்பு',
      secondaryContactLabel: 'இரண்டாம் அவசரத் தொடர்பு',
      addContactBtn: 'தொடர்பு சேர்',
      editContactBtn: 'மாற்று',
      removeContactBtn: 'நீக்கு',
      setPrimaryBtn: 'முதன்மையாக்கு',
      noPrimaryContact: 'முதன்மை அவசரத் தொடர்பு இன்னும் சேர்க்கப்படவில்லை.',
      noSecondaryContact: 'இரண்டாம் அவசரத் தொடர்பு இன்னும் சேர்க்கப்படவில்லை.',
      emergencyAssistBtn: 'அவசர உதவி',
      manageContactsBtn: 'அனைத்து தொடர்புகளும்',
      nationalHelplineTitle: 'தேசிய அவசர உதவி எண்',
    },
    health: {
      title: 'மருத்துவம் மற்றும் மருந்துகள்',
      subtitle: 'உங்கள் உடல்நல விவரங்கள், மருந்துகள், மருத்துவர் ஆலோசனைகள் மற்றும் அறிக்கைகள்.',
      conditions: 'தற்போதைய உடல்நல நிலைகள்',
      allergies: 'ஒவ்வாமை விவரம்',
      primaryDoctor: 'உங்கள் மருத்துவர்',
      preferredHospital: 'மருத்துவமனை',
      medicationSchedule: 'மருந்து அட்டவணை',
      addMedicine: 'மருந்து சேர்',
      medicineName: 'மருந்தின் பெயர்',
      dosage: 'அளவு (எ.கா. 5 மி.கி)',
      time: 'நேரம்',
      medicalReports: 'மருத்துவ அறிக்கைகள்',
      uploadReport: 'அறிக்கை சுருக்கத்தைச் சேர்',
      reportTitle: 'அறிக்கை தலைப்பு',
      reportSummary: 'சுருக்கம் அல்லது குறிப்புகள்',
      nonDiagnosticNote:
        'SENIORA உடல்நலத் தகவல்களை எளிய தமிழில் விளக்கும்; ஆனால் மருத்துவரின் அனுமதியின்றி நோயறிதல் அல்லது மருந்து மாற்றம் செய்யாது.',
    },
    appointments: {
      title: 'மருத்துவர் சந்திப்பு முன்பதிவு',
      subtitle: 'நேரடி அல்லது காணொளி ஆலோசனைக்கு நம்பகமான மருத்துவர்களைத் தேர்வு செய்யுங்கள்.',
      chooseDoctor: 'மருத்துவரைத் தேர்வு செய்க',
      modeInPerson: 'நேரடி சந்திப்பு',
      modeTele: 'காணொளி ஆலோசனை',
      dateLabel: 'தேதி',
      timeLabel: 'நேரம்',
      reasonLabel: 'சந்திப்புக் காரணம்',
      bookButton: 'சந்திப்பை உறுதிசெய் (மாதிரி)',
      upcomingTitle: 'உங்கள் சந்திப்புகள்',
      cancelButton: 'ரத்து செய்',
      demoLabel: 'மாதிரி முன்பதிவு — பயணிக்கும் முன் மருத்துவமனையுடன் உறுதிப்படுத்தவும்.',
    },
    watch: {
      title: 'உடல்நலக் கடிகாரம்',
      subtitle: 'நலக் கடிகாரம் மற்றும் உடல்நலக் கண்காணிப்பு.',
      demoBanner: 'மாதிரித் தகவல்: நேரடி நலக் கடிகாரம் இணைக்கப்படவில்லை. கீழே உள்ளவை மாதிரி அளவீடுகள் மட்டுமே; உண்மையான மருத்துவ அளவீடுகள் அல்ல.',
      connectBluetooth: 'அருகலைக் கடிகாரத்தை இணை',
      useDemoWatch: 'மாதிரி கடிகாரம்',
      syncNow: 'அளவீடுகளைப் புதுப்பி',
      heartRate: 'இதயத் துடிப்பு',
      restingHr: 'ஓய்வு இதயத் துடிப்பு',
      spo2: 'உயிர்வளி அளவு',
      bloodPressure: 'இரத்த அழுத்தம் (சான்றளிக்கப்பட்ட கருவி)',
      bpNote: 'சாதாரணக் கைக்கடிகாரங்கள் இரத்த அழுத்தத்தைத் துல்லியமாக அளக்க முடியாது.',
      stepsToday: 'இன்றைய அடிகள்',
      sleepLastNight: 'தூக்க நேரம்',
      shareDoctor: 'மருத்துவர் அர்ஜுனுடன் பகிர்',
      trendsTitle: '7 நாள் உடல்நலப் போக்கு',
      guidanceNote:
        'அசாதாரண அளவீடுகள் இருந்தால் மருத்துவரை அணுகவும்; நெஞ்சு வலி அல்லது மூச்சுத் திணறல் இருந்தால் உடனே அவசர உதவி (112) அழுத்தவும்.',
    },
    transport: {
      title: 'பயண வசதி (முதியோர் நட்பு)',
      subtitle: 'மருத்துவமனை, மருந்தகம் மற்றும் அன்றாடத் தேவைகளுக்குப் பாதுகாப்பான வாகனம்.',
      purposeLabel: 'பயண நோக்கம்',
      pickupLabel: 'புறப்படும் இடம்',
      destinationLabel: 'செல்லும் இடம்',
      vehicleLabel: 'வாகன வகை',
      accessiblePref: 'சக்கர நாற்காலி / எளிதாக ஏறும் வாகனத்திற்கு முன்னுரிமை',
      bookRideBtn: 'வாகனத்தை உறுதிசெய் (மாதிரி)',
      recentBookings: 'உங்கள் பயணங்கள்',
      cancelRide: 'ரத்து செய்',
      estFare: 'மதிப்பிடப்பட்ட கட்டணம்',
      driverLabel: 'ஓட்டுநர் விவரம்',
      demoNotice: 'மாதிரி பயண முன்பதிவு — உண்மையான நேரடி வாடகை வண்டி அல்ல.',
    },
    companionship: {
      title: 'தோழமை மற்றும் தனிப்பட்ட நினைவகம்',
      subtitle: 'இனிமையான உரையாடல், குடும்பக் குரல்கள், பிடித்த பாடல்கள் மற்றும் சமூக நிகழ்வுகள்.',
      morningCheckIn: 'தினசரி நலன் விசாரிப்பு',
      musicSuggestions: 'இசை & கதை பரிந்துரைகள்',
      playMusicHint: 'உங்கள் நினைவக விருப்பத்தின் அடிப்படையில்',
      memoryTitle: 'உங்கள் தனிப்பட்ட நினைவக சுயவிவரம்',
      memorySub: 'உங்களுக்குப் பிடித்தவை, பிடிக்காதவை ஆகியவற்றை எப்போது வேண்டுமானாலும் மாற்றலாம்.',
      addMemoryBtn: 'விருப்பத்தைச் சேமி',
      deleteBtn: 'நீக்கு',
      ngoSupportTitle: 'தன்னார்வத் தொண்டு நிறுவன உதவி',
      requestVolunteerBtn: 'தன்னார்வலர் வருகையைக் கோரு',
    },
    opportunities: {
      title: 'முதியோருக்கான வாய்ப்புகள்',
      subtitle: 'சரிபார்க்கப்பட்ட பகுதி நேர, வீட்டிலிருந்து செய்யும் மற்றும் வழிகாட்டி பணிகள்.',
      scamWarning: 'பாதுகாப்பு உறுதி: சரிபார்க்கப்பட்ட கூட்டாளர்கள் மட்டும். பதிவுக் கட்டணம் அல்லது வங்கிக் கடவுச்சொல் எதையும் பகிர வேண்டாம்.',
      applyBtn: 'விண்ணப்பிக்கவும்',
      appliedLabel: 'விண்ணப்பம் அனுப்பப்பட்டது',
    },
    reminders: {
      title: 'நினைவூட்டல்கள் & மளிகைப் பட்டியல்',
      subtitle: 'தினசரி பணிகள், சந்திப்புகள், தண்ணீர் மற்றும் குடும்ப நிகழ்வுகள்.',
      addReminder: 'நினைவூட்டல் சேர்',
      shoppingTitle: 'வாங்க வேண்டிய பொருட்கள்',
      addItem: 'பொருள் சேர்',
    },
    settings: {
      title: 'மொழி, வட்டார வழக்கு, குரல் & தனியுரிமை அமைப்புகள்',
      subtitle: 'பேச்சு வேகம், ஒலி அளவு, எழுத்து அளவு, வட்டாரத் தமிழ் வழக்கு மற்றும் தரவு பகிர்வை மாற்றலாம்.',
      languageLabel: 'பயன்பாடு & குரல் மொழி',
      dialectLabel: 'தமிழ்நாடு வட்டாரப் பேச்சு வழக்கு',
      dialectSub: 'உங்கள் பகுதிக்கு ஏற்பப் பழக்கமான, இயல்பான தமிழ் நடையைத் தேர்வு செய்யுங்கள்.',
      testDialectLabel: 'வட்டாரத் தமிழ் உரையாடலைச் சோதிக்கவும்',
      voiceLabel: 'துணையின் குரல்',
      listenSample: 'மாதிரி கேளுங்கள்',
      speedLabel: 'பேச்சு வேகம்',
      volumeLabel: 'ஒலி அளவு',
      fontSizeLabel: 'எழுத்து அளவு',
      highContrastLabel: 'அதிகத் தெளிவுத் தோற்றம்',
      privacyTitle: 'தனியுரிமை & ஒப்புதல்',
      exportDataBtn: 'என் தரவைப் பதிவிறக்கு',
      reopenOnboardingBtn: 'அறிமுகக் கேள்விகளை மீண்டும் திற',
      resetDemoBtn: 'மாதிரி தரவை மீட்டமை',
    },
    emergency: {
      title: 'அவசர உதவி (இந்தியா)',
      subtitle: 'எச்சரிக்கை அனுப்பும் முன் உறுதிப்படுத்தவும் அல்லது நேரடியாக எண்ணை அழைக்கவும்.',
      confirmPrompt: 'உங்களுக்கு இப்போது அவசர உதவி தேவையா?',
      consentLocation: 'அவசர உதவியாளர்கள் மற்றும் நம்பகமானவர்களுடன் என் முகவரியைப் பகிரச் சம்மதிக்கிறேன்',
      triggerAlertBtn: 'உறுதிசெய்து நம்பகமானவர்களுக்கு அறிவி (மாதிரி)',
      honestNotice:
        'நேர்மையான தகவல்: தொலைபேசி எண்ணை அழுத்தினால் உங்கள் சாதன அழைப்பு திறக்கும். இணைய மாதிரி முறையில் எச்சரிக்கைகள் குடும்பம் மற்றும் தொண்டு நிறுவனப் பக்கத்தில் மட்டுமே பதிவு செய்யப்படும்.',
      callNow: 'அழை',
      indiaNumbersTitle: 'இந்திய அவசர எண்கள்',
      trustedContactsTitle: 'உங்கள் நம்பகமான தொடர்புகள்',
      addContactTitle: 'புதிய அவசரத் தொடர்பு சேர்',
      saveContactBtn: 'தொடர்பைச் சேமி',
      closeBtn: 'மூடு',
      alertRecorded: 'அவசர நிகழ்வு குடும்பம், தொண்டு நிறுவனம் மற்றும் மருத்துவர் பக்கத்தில் பதிவு செய்யப்பட்டது (மாதிரி).',
    },
    videoCall: {
      title: 'நேரடி காணொளித் துணை',
      connectingSub: 'அமைதியான, அன்பான நேரடி உரையாடல்',
      listeningStatus: 'உங்கள் குரலைக் கேட்டுக்கொண்டிருக்கிறேன்...',
      thinkingStatus: 'அமைதியாக யோசிக்கிறேன்...',
      speakingStatus: 'பேசுகிறேன்...',
      readyStatus: 'நீங்கள் பேசத் தயார்',
      tapToSpeak: 'பேசத் தட்டவும்',
      stopListening: 'நிறுத்து',
      continuousMode: 'தொடர்ந்து கேள்',
      pauseSpeech: 'குரலை இடைநிறுத்து',
      resumeSpeech: 'மீண்டும் தொடர்',
      repeatLast: 'மீண்டும் சொல்',
      enableMyCamera: 'என் படக்கருவியை இயக்கு',
      disableMyCamera: 'என் படக்கருவியை மறை',
      endCall: 'முகப்பிற்குத் திரும்பு',
      typeMessagePlaceholder: 'அல்லது இங்கே தமிழில் தட்டச்சு செய்யுங்கள்...',
      sendBtn: 'அனுப்பு',
      confirmAction: 'ஆம், உறுதிசெய்',
      dismissAction: 'இப்போது வேண்டாம்',
      quickPromptsTitle: 'இப்படிப் பேசிப் பாருங்கள்:',
      quickPrompts: [
        'எனக்கு முழங்கால் வலி உள்ளது. மருத்துவரைப் பார்க்க வேண்டும்.',
        'நாளை மருத்துவரிடம் செல்ல ஒரு வாகனம் வேண்டும்.',
        'இன்று நான் எடுக்க வேண்டிய மருந்துகள் என்ன?',
        'இன்று காலை உணவு சாப்பிடப் பிடிக்கவில்லை.',
      ],
      aiDialectMicLabel: 'வட்டாரத் தமிழ் குரல் உணர்தல்',
    },
  },
  hi: {
    brandTagline: 'देखभाल जो आपको समझे। साथ जो कभी न छूटे।',
    talkToCompanion: 'अपने साथी से बात करें',
    emergencySos: 'आपातकालीन SOS (112)',
    switchRole: 'भूमिका बदलें / लॉगिन',
    nav: {
      home: 'मुख्य पृष्ठ',
      health: 'स्वास्थ्य व दवाइयाँ',
      appointments: 'डॉक्टर',
      watch: 'हेल्थ वॉच',
      transport: 'यात्रा सेवा',
      companionship: 'साथी व संवाद',
      opportunities: 'अवसर',
      reminders: 'रिमाइंडर',
      impact: 'वैश्विक प्रभाव',
      settings: 'सेटिंग्स',
    },
    onboarding: {
      badge: 'SENIORA में आपका स्वागत है',
      welcomeSpeech:
        'नमस्ते! आपका स्वागत है। मैं आपके दैनिक जीवन को थोड़ा आसान बनाने के लिए यहाँ हूँ। शुरू करने से पहले मैं आपके बारे में कुछ बातें जानना चाहूँगी। क्या हम शुरू करें?',
      welcomeSub: 'कोई जल्दी नहीं है। आप बोलकर या लिखकर जवाब दे सकते हैं, या किसी भी सवाल को छोड़ सकते हैं।',
      tapToHear: 'स्वागत संदेश सुनें',
      repeatQuestion: 'सवाल दोहराएँ',
      skipStep: 'छोड़ें',
      nextStep: 'आगे बढ़ें',
      prevStep: 'पीछे जाएँ',
      finishAndOpen: 'मेरा व्यक्तिगत डैशबोर्ड खोलें',
      speakAnswer: 'बोलकर उत्तर दें',
      listeningNow: 'ध्यान से सुन रही हूँ...',
      typePlaceholder: 'अपना उत्तर यहाँ लिखें...',
      orUseDemoLakshmi: 'डेमो प्रोफ़ाइल देखें (लक्ष्मी, 72)',
      questions: {
        name: '1. हम आपको किस नाम से बुलाएँ?',
        language: '2. आप किस भाषा में बात करना सबसे सहज समझते हैं?',
        voice: '3. क्या आप महिला या पुरुष की आवाज़ पसंद करेंगे? आप पहले नमूना सुन सकते हैं।',
        pace: '4. क्या आप चाहेंगे कि मैं धीरे बोलूँ या सामान्य गति से?',
        living: '5. क्या आप अकेले रहते हैं या किसी के साथ?',
        support: '6. क्या आपको स्वास्थ्य, दैनिक कार्य, यात्रा, सामाजिक जुड़ाव या इन सभी में मदद चाहिए?',
        emergency: '7. क्या आप कोई आपातकालीन संपर्क जोड़ना चाहेंगे?',
      },
      paceSlow: 'धीरे और स्पष्ट बोलें (अनुशंसित)',
      paceNormal: 'सामान्य गति से बोलें',
      livingAlone: 'मैं अकेले रहता/रहती हूँ',
      livingFamily: 'मैं परिवार के साथ रहता/रहती हूँ',
      livingCaregiver: 'मैं देखभालकर्ता के साथ रहता/रहती हूँ',
      supportOptions: {
        healthcare: 'स्वास्थ्य व दवाइयाँ',
        daily_activities: 'दैनिक कार्य व भोजन',
        transportation: 'यात्रा सहायता',
        social_connections: 'सामाजिक जुड़ाव व साथी',
        all: 'इन सभी में मदद',
      },
      emergencyNamePlaceholder: 'संपर्क का नाम (जैसे प्रिया या पड़ोसी)',
      emergencyRelationPlaceholder: 'रिश्ता (बेटी / पड़ोसी)',
      emergencyPhonePlaceholder: 'फ़ोन नंबर (जैसे +91 98450 22334)',
      completionSpeech:
        'बहुत बढ़िया! मैंने आपकी पसंद के अनुसार सब कुछ सेट कर दिया है। जब भी आपको मेरी ज़रूरत हो, बस मुझसे बात करें। आइए आपका व्यक्तिगत स्थान देखें।',
    },
    dashboard: {
      goodMorning: 'सुप्रभात',
      goodAfternoon: 'नमस्कार',
      goodEvening: 'शुभ संध्या',
      greetingSub: 'आज आपकी सुविधा के लिए सब कुछ तैयार है। जब चाहें अपने साथी से बात करें।',
      todaysMedicines: 'आज की दवाइयाँ',
      nextAppointment: 'आगामी डॉक्टर अपॉइंटमेंट',
      hydrationMeals: 'आज का पानी और भोजन',
      voicesOfLove: 'प्यार के संदेश (परिवार)',
      quickActions: 'त्वरित सहायता',
      bookRide: 'गाड़ी बुक करें',
      openWatch: 'हेल्थ वॉच',
      callFamily: 'मुख्य संपर्क को कॉल करें',
      markTaken: 'ले ली',
      snooze: 'बाद में',
      missed: 'छूट गई',
      takenLabel: 'ली जा चुकी',
      pendingLabel: 'आज लेनी है',
      beforeFood: 'खाने से पहले',
      afterFood: 'खाने के बाद',
      withFood: 'खाने के साथ',
      anytime: 'किसी भी समय',
      addWater: '+1 गिलास पानी',
      glassesOfWater: 'गिलास आज',
      logMeal: 'भोजन दर्ज करें',
      mealPlaceholder: 'आपने क्या खाया? (जैसे 2 इडली)',
      saveMeal: 'सहेजें',
      noAppointments: 'कोई आगामी अपॉइंटमेंट नहीं है।',
      pendingPrescriptionTitle: 'डॉक्टर का नया नुस्खा — आपकी सहमति आवश्यक है',
      confirmPrescriptionBtn: 'सहमति दें और दवा ऑर्डर करें (DEMO)',
      declinePrescriptionBtn: 'डॉक्टर से समीक्षा करने को कहें',
      pharmacyTrackerTitle: 'दवा डिलीवरी स्थिति (DEMO)',
      dailyHabits: 'दैनिक अच्छी आदतें',
      dailyRoutine: 'दैनिक समय-सारणी',
      listenMessage: 'संदेश सुनें',
      listenedLabel: 'सुना गया',
      emergencyContactsTitle: 'आपातकालीन संपर्क और तुरंत सहायता',
      emergencyContactsSub: 'अपने विश्वसनीय संपर्कों से तुरंत बात करने के लिए कॉल दबाएँ।',
      primaryContactLabel: 'मुख्य आपातकालीन संपर्क',
      secondaryContactLabel: 'द्वितीयक आपातकालीन संपर्क',
      addContactBtn: 'संपर्क जोड़ें',
      editContactBtn: 'बदलें',
      removeContactBtn: 'हटाएँ',
      setPrimaryBtn: 'मुख्य बनाएँ',
      noPrimaryContact: 'अभी कोई मुख्य आपातकालीन संपर्क नहीं जोड़ा गया है।',
      noSecondaryContact: 'अभी कोई द्वितीयक आपातकालीन संपर्क नहीं जोड़ा गया है।',
      emergencyAssistBtn: 'आपातकालीन सहायता',
      manageContactsBtn: 'सभी संपर्क देखें',
      nationalHelplineTitle: 'राष्ट्रीय आपातकालीन हेल्पलाइन',
    },
    health: {
      title: 'स्वास्थ्य और दवाइयाँ',
      subtitle: 'आपकी स्वास्थ्य प्रोफ़ाइल, दवाइयाँ, डॉक्टर के निर्देश और रिपोर्ट।',
      conditions: 'मौजूदा स्वास्थ्य स्थितियाँ',
      allergies: 'एलर्जी',
      primaryDoctor: 'आपके डॉक्टर',
      preferredHospital: 'पसंदीदा अस्पताल',
      medicationSchedule: 'दवाइयों की समय-सारणी',
      addMedicine: 'दवा जोड़ें',
      medicineName: 'दवा का नाम',
      dosage: 'खुराक (जैसे 5 mg)',
      time: 'समय',
      medicalReports: 'मेडिकल रिपोर्ट',
      uploadReport: 'रिपोर्ट सारांश जोड़ें',
      reportTitle: 'रिपोर्ट का शीर्षक',
      reportSummary: 'सारांश या मुख्य नोट्स',
      nonDiagnosticNote:
        'SENIORA स्वास्थ्य जानकारी सरल शब्दों में समझाती है, लेकिन डॉक्टर की अनुमति के बिना निदान या दवा बदलाव नहीं करती।',
    },
    appointments: {
      title: 'डॉक्टर अपॉइंटमेंट बुकिंग',
      subtitle: 'विश्वसनीय डॉक्टरों के साथ क्लिनिक या वीडियो परामर्श बुक करें।',
      chooseDoctor: 'डॉक्टर चुनें',
      modeInPerson: 'क्लिनिक में मिलें',
      modeTele: 'वीडियो परामर्श',
      dateLabel: 'तारीख',
      timeLabel: 'समय',
      reasonLabel: 'मिलने का कारण',
      bookButton: 'अपॉइंटमेंट पक्का करें (DEMO)',
      upcomingTitle: 'आपके अपॉइंटमेंट',
      cancelButton: 'रद्द करें',
      demoLabel: 'यह एक DEMO बुकिंग है — जाने से पहले क्लिनिक से पुष्टि करें।',
    },
    watch: {
      title: 'HEALTH WATCH',
      subtitle: 'स्मार्टवॉच और स्वास्थ्य निगरानी।',
      demoBanner: 'DEMO DATA: अभी कोई वास्तविक स्मार्टवॉच जुड़ी नहीं है। नीचे दिखाए गए आँकड़े केवल प्रदर्शन (DEMO) के लिए हैं।',
      connectBluetooth: 'ब्लूटूथ वॉच जोड़ें',
      useDemoWatch: 'सिम्युलेटर चलाएँ (DEMO)',
      syncNow: 'रीडिंग अपडेट करें',
      heartRate: 'हृदय गति',
      restingHr: 'विश्राम हृदय गति',
      spo2: 'ऑक्सीजन स्तर (SpO2)',
      bloodPressure: 'रक्तचाप (मान्य कफ़ उपकरण से)',
      bpNote: 'साधारण स्मार्टवॉच रक्तचाप सटीक नहीं माप सकती; मान्य उपकरण आवश्यक है।',
      stepsToday: 'आज के कदम',
      sleepLastNight: 'नींद की अवधि',
      shareDoctor: 'डॉ. अर्जुन के साथ साझा करें',
      trendsTitle: '7 दिनों का स्वास्थ्य रुझान',
      guidanceNote:
        'असामान्य रीडिंग होने पर डॉक्टर से सलाह लें; सीने में दर्द या सांस लेने में तकलीफ पर तुरंत SOS (112) दबाएँ।',
    },
    transport: {
      title: 'सुगम परिवहन सेवा',
      subtitle: 'डॉक्टर के पास जाने, दवा लाने या खरीदारी के लिए सुरक्षित वाहन।',
      purposeLabel: 'यात्रा का उद्देश्य',
      pickupLabel: 'पिकअप स्थान',
      destinationLabel: 'गंतव्य स्थान',
      vehicleLabel: 'वाहन चुनें',
      accessiblePref: 'व्हीलचेयर / कम ऊँचाई वाले सुगम वाहन को प्राथमिकता दें',
      bookRideBtn: 'वाहन बुक करें (DEMO)',
      recentBookings: 'आपकी बुकिंग',
      cancelRide: 'रद्द करें',
      estFare: 'अनुमानित किराया',
      driverLabel: 'ड्राइवर विवरण',
      demoNotice: 'DEMO परिवहन बुकिंग — वास्तविक लाइव टैक्सी नहीं।',
    },
    companionship: {
      title: 'साथी और व्यक्तिगत स्मृति',
      subtitle: 'आत्मीय बातचीत, परिवार के संदेश, पसंदीदा संगीत और सामुदायिक कार्यक्रम।',
      morningCheckIn: 'दैनिक हालचाल बातचीत',
      musicSuggestions: 'संगीत और कहानी सुझाव',
      playMusicHint: 'आपकी पसंद के अनुसार',
      memoryTitle: 'आपकी व्यक्तिगत स्मृति प्रोफ़ाइल',
      memorySub: 'अपनी पसंद, नापसंद और आदतें कभी भी देखें, बदलें या हटाएँ।',
      addMemoryBtn: 'पसंद सहेजें',
      deleteBtn: 'हटाएँ',
      ngoSupportTitle: 'NGO स्वयंसेवक सहायता',
      requestVolunteerBtn: 'स्वयंसेवक सहायता का अनुरोध करें',
    },
    opportunities: {
      title: 'वरिष्ठ नागरिकों के लिए अवसर',
      subtitle: 'सत्यापित पार्ट-टाइम, घर से काम और मेंटरिंग अवसर।',
      scamWarning: 'सुरक्षा वादा: केवल सत्यापित साझेदार। कभी कोई पंजीकरण शुल्क या बैंक OTP साझा न करें।',
      applyBtn: 'रुचि दिखाएँ',
      appliedLabel: 'आवेदन भेजा गया',
    },
    reminders: {
      title: 'रिमाइंडर और खरीदारी सूची',
      subtitle: 'दैनिक कार्य, पानी, जन्मदिन और ज़रूरी सामान याद रखें।',
      addReminder: 'रिमाइंडर जोड़ें',
      shoppingTitle: 'खरीदारी सूची',
      addItem: 'सामान जोड़ें',
    },
    settings: {
      title: 'भाषा, आवाज़ और गोपनीयता सेटिंग्स',
      subtitle: 'बोलने की गति, आवाज़, अक्षर का आकार, भाषा और गोपनीयता कभी भी बदलें।',
      languageLabel: 'ऐप और आवाज़ की भाषा',
      dialectLabel: 'तमिल क्षेत्रीय बोली',
      dialectSub: 'यदि आप तमिल चुनते हैं, तो अपनी पसंद की क्षेत्रीय शैली चुनें।',
      testDialectLabel: 'क्षेत्रीय तमिल परीक्षण वाक्यांश',
      voiceLabel: 'साथी की आवाज़ चुनें',
      listenSample: 'नमूना सुनें',
      speedLabel: 'बोलने की गति',
      volumeLabel: 'आवाज़ का स्तर',
      fontSizeLabel: 'अक्षरों का आकार',
      highContrastLabel: 'हाई कॉन्ट्रास्ट मोड',
      privacyTitle: 'गोपनीयता और डेटा साझा करने की अनुमति',
      exportDataBtn: 'मेरा डेटा डाउनलोड करें (JSON)',
      reopenOnboardingBtn: 'प्रारंभिक परिचय फिर से खोलें',
      resetDemoBtn: 'डेमो डेटा रीसेट करें',
    },
    emergency: {
      title: 'आपातकालीन सहायता (भारत)',
      subtitle: 'संदेश भेजने से पहले पुष्टि करें या सीधे आपातकालीन नंबर पर कॉल करें।',
      confirmPrompt: 'क्या आपको अभी तुरंत आपातकालीन मदद की ज़रूरत है?',
      consentLocation: 'आपातकालीन सेवाओं और विश्वसनीय संपर्कों के साथ मेरा पता साझा करने की अनुमति दें',
      triggerAlertBtn: 'पुष्टि करें और विश्वसनीय संपर्कों को सूचित करें (DEMO)',
      honestNotice:
        'स्पष्ट सूचना: नंबर दबाने पर आपके फ़ोन का डायलर खुलेगा। वेब DEMO में अलर्ट केवल परिवार और NGO डैशबोर्ड पर दर्ज होते हैं।',
      callNow: 'कॉल करें',
      indiaNumbersTitle: 'भारत के आपातकालीन नंबर',
      trustedContactsTitle: 'आपके विश्वसनीय संपर्क',
      addContactTitle: 'नया आपातकालीन संपर्क जोड़ें',
      saveContactBtn: 'संपर्क सहेजें',
      closeBtn: 'बंद करें',
      alertRecorded: 'आपातकालीन सूचना परिवार, NGO और डॉक्टर डैशबोर्ड में दर्ज कर दी गई है (DEMO)।',
    },
    videoCall: {
      title: 'लाइव वीडियो साथी',
      connectingSub: 'शांत और आत्मीय सीधी बातचीत',
      listeningStatus: 'आपकी बात सुन रही हूँ...',
      thinkingStatus: 'आराम से सोच रही हूँ...',
      speakingStatus: 'बोल रही हूँ...',
      readyStatus: 'जब आप बोलें, मैं सुनने के लिए तैयार हूँ',
      tapToSpeak: 'बोलने के लिए दबाएँ',
      stopListening: 'सुनना रोकें',
      continuousMode: 'लगातार सुनते रहें',
      pauseSpeech: 'आवाज़ रोकें',
      resumeSpeech: 'आगे सुनें',
      repeatLast: 'पिछली बात दोहराएँ',
      enableMyCamera: 'मेरा कैमरा चालू करें',
      disableMyCamera: 'मेरा कैमरा छिपाएँ',
      endCall: 'डैशबोर्ड पर लौटें',
      typeMessagePlaceholder: 'या यहाँ लिखकर बताएँ...',
      sendBtn: 'भेजें',
      confirmAction: 'हाँ, पक्का करें',
      dismissAction: 'अभी नहीं',
      quickPromptsTitle: 'आप यह कहकर देख सकते हैं:',
      quickPrompts: [
        'मेरे घुटने में दर्द हो रहा है। मुझे डॉक्टर को दिखाना है।',
        'कल डॉक्टर से मिलने जाने के लिए मुझे गाड़ी चाहिए।',
        'बताइए मुझे आज कौन-सी दवाइयाँ लेनी हैं।',
        'आज मुझे नाश्ता करने का मन नहीं है।',
      ],
      aiDialectMicLabel: 'उच्च-सटीकता क्षेत्रीय आवाज़ पहचान (AI)',
    },
  },
};

export function getGreeting(lang: LanguageCode): string {
  const hour = new Date().getHours();
  const t = TRANSLATIONS[lang].dashboard;
  if (hour < 12) return t.goodMorning;
  if (hour < 17) return t.goodAfternoon;
  return t.goodEvening;
}
