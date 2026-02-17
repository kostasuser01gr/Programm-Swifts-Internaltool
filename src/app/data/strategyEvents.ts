// ─── Station Wars — Event Deck ───────────────────────────────
// 60+ events spanning customer, fleet, staff, weather, corporate, random scenarios.
// Each event has 2-3 choices with resource effects and optional risk outcomes.

import type { GameEvent } from '../types/strategyGame';

// ─── Event Pool ──────────────────────────────────────────────

export const EVENT_DECK: GameEvent[] = [
  // ═══ CUSTOMER EVENTS ═══
  {
    id: 'e-01', title: 'Ομαδική Κράτηση', titleEn: 'Group Booking',
    description: '12 τουρίστες θέλουν 6 αυτοκίνητα για μια εβδομάδα. Μεγάλο κέρδος αλλά πολλά οχήματα δεσμεύονται.', descriptionEn: 'A group of 12 tourists want 6 cars for a week.',
    icon: '👥', severity: 'opportunity', category: 'customer', probability: 0.7,
    choices: [
      { id: 'e01-a', label: 'Δέξου όλα', labelEn: 'Accept all', description: 'Δέσμευσε 6 οχήματα', descriptionEn: 'Lock 6 vehicles', icon: '✅', effects: { fleet: -6, budget: 1800, rating: 5 }, risk: { probability: 0.2, bonusEffects: { budget: 500, rating: 5 }, penaltyEffects: { rating: -10, budget: -200 }, bonusText: 'Χαρούμενοι τουρίστες — μπόνους!', penaltyText: 'Παράπονα για την κατάσταση ενός αυτοκινήτου' } },
      { id: 'e01-b', label: 'Μόνο 3 αυτοκίνητα', labelEn: 'Only 3 cars', description: 'Μερική αποδοχή', descriptionEn: 'Partial accept', icon: '🤝', effects: { fleet: -3, budget: 900, rating: 2 } },
      { id: 'e01-c', label: 'Άρνηση', labelEn: 'Decline', description: 'Δεν έχεις αρκετά', descriptionEn: 'Not enough', icon: '❌', effects: { rating: -3 } },
    ],
  },
  {
    id: 'e-02', title: 'Δυσαρεστημένος Πελάτης', titleEn: 'Angry Customer',
    description: 'Ένας πελάτης βρήκε γρατζουνιά στο αυτοκίνητο και απαιτεί αποζημίωση. Πρέπει να αποφασίσεις γρήγορα.', descriptionEn: 'A customer found a scratch on their car and demands compensation.',
    icon: '😠', severity: 'warning', category: 'customer', probability: 0.8,
    choices: [
      { id: 'e02-a', label: 'Πλήρης αποζημίωση', labelEn: 'Full refund', description: 'Επιστρέφεις 200€', descriptionEn: 'Refund 200€', icon: '💶', effects: { budget: -200, rating: 8 } },
      { id: 'e02-b', label: 'Αναβάθμιση οχήματος', labelEn: 'Free upgrade', description: 'Δίνεις καλύτερο αυτοκίνητο', descriptionEn: 'Give better car', icon: '🚗', effects: { fleet: -1, rating: 5, budget: -50 } },
      { id: 'e02-c', label: 'Εξήγηση & μικρή έκπτωση', labelEn: 'Explain + small discount', description: 'Μειωμένο κόστος', descriptionEn: 'Reduced cost', icon: '🗣️', effects: { budget: -50, rating: -2, time: -1 }, risk: { probability: 0.4, bonusEffects: { rating: 3 }, penaltyEffects: { rating: -8 }, bonusText: 'Ο πελάτης κατάλαβε!', penaltyText: 'Αρνητική κριτική online' } },
    ],
  },
  {
    id: 'e-03', title: 'VIP Πελάτης', titleEn: 'VIP Customer',
    description: 'Γνωστή εταιρεία ζητά premium υπηρεσία για τον CEO τους. Μεγάλη ευκαιρία.', descriptionEn: 'A major company requests premium service for their CEO.',
    icon: '👑', severity: 'opportunity', category: 'customer', probability: 0.4, requiresRating: 60,
    choices: [
      { id: 'e03-a', label: 'Premium πακέτο', labelEn: 'Premium package', description: 'Αφιέρωσε χρόνο + καλό αυτοκίνητο', descriptionEn: 'Dedicate time + good car', icon: '⭐', effects: { fleet: -1, staff: -1, time: -3, budget: 800, rating: 10 }, risk: { probability: 0.3, bonusEffects: { budget: 1000, rating: 5 }, penaltyEffects: {}, bonusText: 'Ο CEO εντυπωσιάστηκε — σύμβαση!', penaltyText: '' } },
      { id: 'e03-b', label: 'Κανονική εξυπηρέτηση', labelEn: 'Standard service', description: 'Χωρίς ιδιαίτερη προσοχή', descriptionEn: 'No special treatment', icon: '🚗', effects: { fleet: -1, budget: 300, rating: 2 } },
    ],
  },
  {
    id: 'e-04', title: 'Online Review Bomb', titleEn: 'Online Review Bomb',
    description: 'Ξαφνικά εμφανίζονται 5 αρνητικές κριτικές στο Google. Πιθανός ανταγωνιστής;', descriptionEn: '5 sudden negative reviews on Google.',
    icon: '⭐', severity: 'critical', category: 'customer', probability: 0.3, minDay: 5,
    choices: [
      { id: 'e04-a', label: 'Προσωπική απάντηση', labelEn: 'Personal response', description: 'Αφιέρωσε χρόνο σε κάθε μία', descriptionEn: 'Respond to each', icon: '✍️', effects: { time: -4, rating: 5, staff: -1 } },
      { id: 'e04-b', label: 'Δώσε δωρεάν ενοικίαση', labelEn: 'Free rental promo', description: 'Μάρκετινγκ αντεπίθεση', descriptionEn: 'Marketing counter', icon: '🎁', effects: { budget: -300, rating: 8, fleet: -1 } },
      { id: 'e04-c', label: 'Αγνόησε', labelEn: 'Ignore', description: 'Ελπίδα ότι θα ξεχαστούν', descriptionEn: 'Hope they fade', icon: '🙈', effects: { rating: -8 } },
    ],
  },
  {
    id: 'e-05', title: 'Τουριστική Σεζόν', titleEn: 'Tourist Season',
    description: 'Η σεζόν αρχίζει! Η ζήτηση αυξάνεται δραματικά. Πρέπει να αντεπεξέλθεις.', descriptionEn: 'Season starts! Demand increases dramatically.',
    icon: '🏖️', severity: 'opportunity', category: 'customer', probability: 0.5, minDay: 8,
    choices: [
      { id: 'e05-a', label: 'Αύξηση τιμών 30%', labelEn: 'Raise prices 30%', description: 'Περισσότερα κέρδη ανά αυτοκίνητο', descriptionEn: 'More profit per car', icon: '💰', effects: { budget: 1200, rating: -5 } },
      { id: 'e05-b', label: 'Διατήρηση τιμών', labelEn: 'Keep prices', description: 'Ίδιες τιμές, πολύς κόσμος', descriptionEn: 'Same prices, lots of people', icon: '🤝', effects: { budget: 600, rating: 8, fleet: -5 } },
      { id: 'e05-c', label: 'Ειδικές προσφορές', labelEn: 'Special offers', description: 'Εβδομαδιαία πακέτα', descriptionEn: 'Weekly packages', icon: '🎉', effects: { budget: 400, rating: 12, fleet: -3 } },
    ],
  },
  // ═══ FLEET EVENTS ═══
  {
    id: 'e-10', title: 'Μηχανική Βλάβη', titleEn: 'Mechanical Failure',
    description: 'Δύο οχήματα χρειάζονται επισκευή. Ένα σοβαρό, ένα ελαφρό.', descriptionEn: 'Two vehicles need repair. One serious, one minor.',
    icon: '🔧', severity: 'warning', category: 'fleet', probability: 0.7,
    choices: [
      { id: 'e10-a', label: 'Επισκεύασε αμφότερα', labelEn: 'Fix both', description: 'Πλήρη επισκευή τώρα', descriptionEn: 'Full repair now', icon: '🔧', effects: { budget: -400, fleet: -2, time: -3 }, risk: { probability: 0.3, bonusEffects: { fleet: 2 }, penaltyEffects: {}, bonusText: 'Γρήγορη επισκευή — πίσω σε 1 ώρα!', penaltyText: '' } },
      { id: 'e10-b', label: 'Μόνο το σοβαρό', labelEn: 'Only the serious one', description: 'Το ελαφρό θα περιμένει', descriptionEn: 'Light one waits', icon: '⚙️', effects: { budget: -250, fleet: -1, time: -2 } },
      { id: 'e10-c', label: 'Αναβολή', labelEn: 'Postpone', description: 'Κίνδυνος χειρότερων βλαβών', descriptionEn: 'Risk of worse failures', icon: '⏰', effects: { time: -1 }, risk: { probability: 0.5, bonusEffects: {}, penaltyEffects: { fleet: -3, budget: -600, rating: -5 }, bonusText: '', penaltyText: 'Η αναβολή κόστισε — σοβαρή βλάβη!' } },
    ],
  },
  {
    id: 'e-11', title: 'Νέα Παρτίδα Αυτοκινήτων', titleEn: 'New Car Batch',
    description: 'Η εταιρεία προσφέρει 5 νέα οχήματα. Πρέπει να πληρώσεις μέρος.', descriptionEn: 'Company offers 5 new vehicles. You pay part of the cost.',
    icon: '🚗', severity: 'opportunity', category: 'fleet', probability: 0.4, minDay: 3,
    choices: [
      { id: 'e11-a', label: 'Πάρε και τα 5', labelEn: 'Take all 5', description: 'Πολλά νέα αυτοκίνητα', descriptionEn: 'Many new cars', icon: '✅', effects: { fleet: 5, budget: -800, staff: -1, time: -2 }, requiredResources: { budget: 800 } },
      { id: 'e11-b', label: 'Πάρε 2', labelEn: 'Take 2', description: 'Μετριοπαθής αύξηση', descriptionEn: 'Moderate increase', icon: '🤝', effects: { fleet: 2, budget: -300, time: -1 } },
      { id: 'e11-c', label: 'Όχι τώρα', labelEn: 'Not now', description: 'Δεν χρειάζεσαι', descriptionEn: 'Don\'t need them', icon: '❌', effects: {} },
    ],
  },
  {
    id: 'e-12', title: 'Τρακάρισμα Πελάτη', titleEn: 'Customer Accident',
    description: 'Πελάτης τράκαρε ελαφρά. Ζημιά στον προφυλακτήρα. Ασφάλεια καλύπτει μέρος.', descriptionEn: 'Customer had a minor accident. Insurance covers part.',
    icon: '💥', severity: 'warning', category: 'fleet', probability: 0.6,
    choices: [
      { id: 'e12-a', label: 'Γρήγορη επισκευή', labelEn: 'Quick fix', description: 'Επισκεύασε κυρίως αισθητικά', descriptionEn: 'Mostly cosmetic fix', icon: '🔧', effects: { fleet: -1, budget: -150, time: -2 } },
      { id: 'e12-b', label: 'Πλήρης επισκευή + βαφή', labelEn: 'Full repair', description: 'Σαν καινούριο', descriptionEn: 'Like new', icon: '✨', effects: { fleet: -1, budget: -400, time: -3 }, risk: { probability: 0.5, bonusEffects: { fleet: 1, rating: 3 }, penaltyEffects: {}, bonusText: 'Τέλειο αποτέλεσμα — ο πελάτης ξαναέρχεται!', penaltyText: '' } },
      { id: 'e12-c', label: 'Χρέωσε τον πελάτη', labelEn: 'Charge customer', description: 'Το ρίσκο είναι η κριτική', descriptionEn: 'Risk is the review', icon: '💶', effects: { budget: 200, rating: -10 } },
    ],
  },
  {
    id: 'e-13', title: 'Πλυντήρια — Μεγάλη Ουρά', titleEn: 'Wash Queue Overflow',
    description: '10 αυτοκίνητα χρειάζονται πλύσιμο ΤΩΡΑ. Οι πλύντες δεν προλαβαίνουν.', descriptionEn: '10 cars need washing NOW. Washers can\'t keep up.',
    icon: '🚿', severity: 'warning', category: 'fleet', probability: 0.5, minDay: 5,
    choices: [
      { id: 'e13-a', label: 'Εξωτερικό συνεργείο', labelEn: 'External crew', description: 'Πλήρωσε extra πλύντες', descriptionEn: 'Pay extra washers', icon: '💰', effects: { budget: -300, time: -1, rating: 3 } },
      { id: 'e13-b', label: 'Όλοι στα πλυντήρια', labelEn: 'All hands washing', description: 'Υπάλληλοι βοηθούν', descriptionEn: 'Staff helps', icon: '🙋', effects: { staff: -3, time: -4, rating: 2 } },
      { id: 'e13-c', label: 'Δώσε βρώμικα', labelEn: 'Give dirty cars', description: 'Ρίσκο κριτικής', descriptionEn: 'Risk bad review', icon: '😬', effects: { time: 0 }, risk: { probability: 0.6, bonusEffects: {}, penaltyEffects: { rating: -12 }, bonusText: '', penaltyText: 'Πελάτες παραπονέθηκαν για βρώμικα αυτοκίνητα!' } },
    ],
  },
  // ═══ STAFF EVENTS ═══
  {
    id: 'e-20', title: 'Υπάλληλος Αρρώστησε', titleEn: 'Employee Sick',
    description: 'Βασικός υπάλληλος αρρώστησε ξαφνικά. Πρέπει να καλύψεις τη βάρδια.', descriptionEn: 'Key employee suddenly fell ill. Need to cover the shift.',
    icon: '🤒', severity: 'warning', category: 'staff', probability: 0.6,
    choices: [
      { id: 'e20-a', label: 'Βάλε αντικαταστάτη', labelEn: 'Get replacement', description: 'Πλήρωσε υπερωρία', descriptionEn: 'Pay overtime', icon: '💶', effects: { budget: -200, staff: -1, time: -1 } },
      { id: 'e20-b', label: 'Κάλυψε μόνος σου', labelEn: 'Cover yourself', description: 'Κουραστικό αλλά δωρεάν', descriptionEn: 'Tiring but free', icon: '💪', effects: { time: -5, staff: -1 }, risk: { probability: 0.3, bonusEffects: { rating: 5 }, penaltyEffects: { rating: -3 }, bonusText: 'Η ομάδα εκτίμησε τη δέσμευσή σου!', penaltyText: 'Κούραση — μικρά λάθη...' } },
      { id: 'e20-c', label: 'Κλείσε με λιγότερα', labelEn: 'Work short-staffed', description: 'Η ομάδα φορτώνεται', descriptionEn: 'Team overloaded', icon: '😰', effects: { staff: -1, rating: -5 } },
    ],
  },
  {
    id: 'e-21', title: 'Εκπαίδευση Ομάδας', titleEn: 'Team Training',
    description: 'Ευκαιρία για εκπαίδευση νέου συστήματος. Βελτιώνει την απόδοση μακροπρόθεσμα.', descriptionEn: 'Opportunity for new system training. Long-term improvement.',
    icon: '📚', severity: 'opportunity', category: 'staff', probability: 0.4, minDay: 5,
    choices: [
      { id: 'e21-a', label: 'Πλήρης εκπαίδευση', labelEn: 'Full training', description: '4 ώρες, 500€', descriptionEn: '4 hours, 500€', icon: '🎓', effects: { budget: -500, time: -4, staff: 2, rating: 5 } },
      { id: 'e21-b', label: 'Μίνι εκπαίδευση', labelEn: 'Mini training', description: '1 ώρα, βασικά', descriptionEn: '1 hour, basics', icon: '📖', effects: { budget: -100, time: -1, staff: 1 } },
      { id: 'e21-c', label: 'Αναβολή', labelEn: 'Skip', description: 'Δεν έχεις χρόνο τώρα', descriptionEn: 'No time now', icon: '⏰', effects: {} },
    ],
  },
  {
    id: 'e-22', title: 'Διαφωνία Υπαλλήλων', titleEn: 'Staff Conflict',
    description: 'Δύο υπάλληλοι τσακώθηκαν για τη βάρδια. Η ατμόσφαιρα είναι τεταμένη.', descriptionEn: 'Two employees argued about shifts. Tension in the air.',
    icon: '⚡', severity: 'warning', category: 'staff', probability: 0.5,
    choices: [
      { id: 'e22-a', label: 'Μεσολάβησε', labelEn: 'Mediate', description: 'Αφιέρωσε χρόνο στη λύση', descriptionEn: 'Spend time resolving', icon: '🤝', effects: { time: -3, staff: 1, rating: 2 } },
      { id: 'e22-b', label: 'Αυστηρή προειδοποίηση', labelEn: 'Strict warning', description: 'Μπορεί να κάνει χειρότερα', descriptionEn: 'Might make it worse', icon: '⚠️', effects: { time: -1 }, risk: { probability: 0.4, bonusEffects: { staff: 1 }, penaltyEffects: { staff: -2 }, bonusText: 'Συμμορφώθηκαν', penaltyText: 'Ένας υπάλληλος ζήτησε μετάθεση!' } },
      { id: 'e22-c', label: 'Αγνόησε', labelEn: 'Ignore', description: 'Θα λυθεί μόνο του;', descriptionEn: 'Will it resolve?', icon: '🙈', effects: {}, risk: { probability: 0.6, bonusEffects: {}, penaltyEffects: { staff: -1, rating: -3 }, bonusText: '', penaltyText: 'Η κατάσταση χειροτέρεψε' } },
    ],
  },
  {
    id: 'e-23', title: 'Νέα Πρόσληψη', titleEn: 'New Hire Available',
    description: 'Καλός υποψήφιος για θέση. Έμπειρος στον τομέα ενοικιάσεων.', descriptionEn: 'Good candidate available. Experienced in car rental.',
    icon: '👤', severity: 'opportunity', category: 'staff', probability: 0.3, minDay: 8,
    choices: [
      { id: 'e23-a', label: 'Πρόσλαβε', labelEn: 'Hire', description: 'Μόνιμη θέση', descriptionEn: 'Permanent position', icon: '✅', effects: { staff: 2, budget: -600, time: -2 }, requiredResources: { budget: 600 } },
      { id: 'e23-b', label: 'Part-time', labelEn: 'Part-time', description: 'Μερική απασχόληση', descriptionEn: 'Part-time', icon: '⏰', effects: { staff: 1, budget: -250, time: -1 } },
      { id: 'e23-c', label: 'Όχι τώρα', labelEn: 'Not now', description: 'Δεν χρειάζεσαι', descriptionEn: 'Don\'t need them', icon: '❌', effects: {} },
    ],
  },
  // ═══ WEATHER EVENTS ═══
  {
    id: 'e-30', title: 'Καύσωνας', titleEn: 'Heatwave',
    description: 'Θερμοκρασία 42°C! Τα αυτοκίνητα ζεσταίνονται, ο κόσμος ζητάει AC.', descriptionEn: '42°C! Cars overheat, everyone wants AC.',
    icon: '☀️', severity: 'warning', category: 'weather', probability: 0.5, minDay: 5,
    choices: [
      { id: 'e30-a', label: 'Σκίαστρα + νερά', labelEn: 'Shade + water', description: 'Προστάτεψε στόλο + πελάτες', descriptionEn: 'Protect fleet + customers', icon: '🏖️', effects: { budget: -150, rating: 5, time: -2 } },
      { id: 'e30-b', label: 'Έλεγχος AC', labelEn: 'Check AC', description: 'Σιγουρέψου ότι δουλεύουν', descriptionEn: 'Make sure they work', icon: '❄️', effects: { budget: -100, time: -3, staff: -1 }, risk: { probability: 0.3, bonusEffects: { rating: 8 }, penaltyEffects: { fleet: -2, rating: -5 }, bonusText: 'Όλα τα AC σε τάξη!', penaltyText: '2 AC χαλασμένα — δυσαρεστημένοι πελάτες' } },
      { id: 'e30-c', label: 'Τίποτα ιδιαίτερο', labelEn: 'Nothing special', description: 'Κάνε τα συνηθισμένα', descriptionEn: 'Business as usual', icon: '🤷', effects: { rating: -3 } },
    ],
  },
  {
    id: 'e-31', title: 'Κακοκαιρία', titleEn: 'Storm',
    description: 'Ισχυρή βροχόπτωση. Λασπωμένα αυτοκίνητα, δρόμοι πλημμυρισμένοι.', descriptionEn: 'Heavy rain. Muddy cars, flooded roads.',
    icon: '🌧️', severity: 'warning', category: 'weather', probability: 0.4,
    choices: [
      { id: 'e31-a', label: 'Καθαρισμός στόλου', labelEn: 'Fleet wash', description: 'Πλύνε τα πάντα', descriptionEn: 'Wash everything', icon: '🧹', effects: { budget: -200, staff: -2, time: -3, rating: 5 } },
      { id: 'e31-b', label: 'Μείωσε κρατήσεις', labelEn: 'Reduce rentals', description: 'Λιγότερα αυτοκίνητα στο δρόμο', descriptionEn: 'Fewer cars on road', icon: '📉', effects: { budget: -400, rating: 3, fleet: 3 } },
      { id: 'e31-c', label: 'Κανονική λειτουργία', labelEn: 'Normal ops', description: 'Αδιαφόρησε', descriptionEn: 'Carry on', icon: '🤷', effects: {}, risk: { probability: 0.4, bonusEffects: {}, penaltyEffects: { fleet: -2, rating: -8 }, bonusText: '', penaltyText: 'Πελάτης κόλλησε σε πλημμύρα — κακή κριτική!' } },
    ],
  },
  // ═══ CORPORATE EVENTS ═══
  {
    id: 'e-40', title: 'Αξιολόγηση Εταιρείας', titleEn: 'Corporate Audit',
    description: 'Η εταιρεία στέλνει ελεγκτή. Πρέπει να είσαι έτοιμος.', descriptionEn: 'HQ is sending an auditor. Be ready.',
    icon: '📋', severity: 'critical', category: 'corporate', probability: 0.3, minDay: 10,
    choices: [
      { id: 'e40-a', label: 'Πλήρης ετοιμότητα', labelEn: 'Full preparation', description: 'Καθάρισε τα πάντα', descriptionEn: 'Clean everything', icon: '✨', effects: { staff: -3, time: -5, budget: -200 }, risk: { probability: 0.7, bonusEffects: { rating: 15, budget: 500 }, penaltyEffects: { rating: -5 }, bonusText: 'Εξαιρετική αξιολόγηση! Μπόνους!', penaltyText: 'Βρέθηκαν μικρά σφάλματα' } },
      { id: 'e40-b', label: 'Βασική ετοιμότητα', labelEn: 'Basic prep', description: 'Τα πιο σημαντικά μόνο', descriptionEn: 'Key areas only', icon: '📌', effects: { time: -2, staff: -1 }, risk: { probability: 0.5, bonusEffects: { rating: 5 }, penaltyEffects: { rating: -10, budget: -300 }, bonusText: 'Αρκετά καλά!', penaltyText: 'Ο ελεγκτής δεν ήταν ικανοποιημένος' } },
      { id: 'e40-c', label: 'Αυτοπεποίθηση', labelEn: 'Confidence', description: 'Δεν χρειάζεται προετοιμασία', descriptionEn: 'No prep needed', icon: '😎', effects: {}, risk: { probability: 0.7, bonusEffects: {}, penaltyEffects: { rating: -15, budget: -500 }, bonusText: '', penaltyText: 'Καταστροφική αξιολόγηση!' } },
    ],
  },
  {
    id: 'e-41', title: 'Νέα Πολιτική HQ', titleEn: 'New HQ Policy',
    description: 'Η εταιρεία απαιτεί νέα πρωτόκολλα ασφαλείας. Κόστος εφαρμογής.', descriptionEn: 'Company requires new safety protocols.',
    icon: '📜', severity: 'info', category: 'corporate', probability: 0.4, minDay: 7,
    choices: [
      { id: 'e41-a', label: 'Πλήρης εφαρμογή', labelEn: 'Full compliance', description: 'Εφάρμοσε αμέσως', descriptionEn: 'Implement now', icon: '✅', effects: { budget: -400, time: -3, staff: -1, rating: 8 } },
      { id: 'e41-b', label: 'Σταδιακή εφαρμογή', labelEn: 'Gradual rollout', description: '2 εβδομάδες μετάβαση', descriptionEn: '2-week transition', icon: '📈', effects: { budget: -200, time: -1, rating: 3 } },
    ],
  },
  {
    id: 'e-42', title: 'Bonus Εταιρείας', titleEn: 'Corporate Bonus',
    description: 'Η εταιρεία δίνει μπόνους απόδοσης! Πώς θα τα μοιράσεις;', descriptionEn: 'Company gives performance bonus! How to distribute?',
    icon: '🎉', severity: 'opportunity', category: 'corporate', probability: 0.3, minDay: 12, requiresRating: 70,
    choices: [
      { id: 'e42-a', label: 'Μοίρασε στην ομάδα', labelEn: 'Share with team', description: 'Κάθε υπάλληλος παίρνει μέρος', descriptionEn: 'Everyone gets a share', icon: '👥', effects: { budget: 500, staff: 2, rating: 3 } },
      { id: 'e42-b', label: 'Επένδυση στον στόλο', labelEn: 'Invest in fleet', description: 'Αγόρασε εξαρτήματα', descriptionEn: 'Buy parts', icon: '🔧', effects: { budget: 300, fleet: 3 } },
      { id: 'e42-c', label: 'Απόθεμα ασφαλείας', labelEn: 'Safety reserve', description: 'Κράτα τα χρήματα', descriptionEn: 'Keep the money', icon: '💰', effects: { budget: 800 } },
    ],
  },
  // ═══ RANDOM EVENTS ═══
  {
    id: 'e-50', title: 'Viral TikTok', titleEn: 'Viral TikTok',
    description: 'Τουρίστας ανέβασε ωραίο TikTok με τον σταθμό σας. 500K views!', descriptionEn: 'Tourist posted a nice TikTok about your station. 500K views!',
    icon: '📱', severity: 'opportunity', category: 'random', probability: 0.2, requiresRating: 65,
    choices: [
      { id: 'e50-a', label: 'Εκμεταλλεύσου', labelEn: 'Capitalize', description: 'Ειδική προσφορά TikTok', descriptionEn: 'TikTok special offer', icon: '🎬', effects: { budget: -100, rating: 12, fleet: -3 } },
      { id: 'e50-b', label: 'Ευχαρίστησε', labelEn: 'Just thank them', description: 'Comment + thank you', descriptionEn: 'Comment + thank you', icon: '🙏', effects: { rating: 6 } },
    ],
  },
  {
    id: 'e-51', title: 'Κλοπή Αυτοκινήτου', titleEn: 'Car Theft',
    description: 'Ένα αυτοκίνητο κλάπηκε! Ο πελάτης ισχυρίζεται ότι δεν φταίει.', descriptionEn: 'A car was stolen! Customer claims it\'s not their fault.',
    icon: '🚨', severity: 'critical', category: 'random', probability: 0.15,
    choices: [
      { id: 'e51-a', label: 'Ασφάλεια + Αστυνομία', labelEn: 'Insurance + Police', description: 'Σωστή διαδικασία', descriptionEn: 'Proper procedure', icon: '🛡️', effects: { fleet: -1, budget: -300, time: -4, staff: -1 } },
      { id: 'e51-b', label: 'Δίωξε τον πελάτη', labelEn: 'Pursue customer', description: 'Ψάξε το περισσότερο', descriptionEn: 'Investigate further', icon: '🔍', effects: { fleet: -1, time: -6, staff: -2, budget: -100 }, risk: { probability: 0.4, bonusEffects: { fleet: 1, budget: 500 }, penaltyEffects: { rating: -10, budget: -400 }, bonusText: 'Βρέθηκε! Ο πελάτης πλήρωσε!', penaltyText: 'Δεν βρέθηκε — κακή εικόνα' } },
    ],
  },
  {
    id: 'e-52', title: 'Εκδήλωση στην Πόλη', titleEn: 'City Event',
    description: 'Μεγάλο συνέδριο στο Ηράκλειο. 200 σύνεδροι ψάχνουν αυτοκίνητα.', descriptionEn: 'Big conference in Heraklion. 200 attendees looking for cars.',
    icon: '🏛️', severity: 'opportunity', category: 'random', probability: 0.3, minDay: 7, requiresFleet: 10,
    choices: [
      { id: 'e52-a', label: 'Επιθετική στρατηγική', labelEn: 'Aggressive strategy', description: 'Διαφημίσου, δέσμευσε πολλά', descriptionEn: 'Advertise, commit many', icon: '📢', effects: { fleet: -8, budget: 2000, staff: -2, time: -3, rating: 5 }, requiredResources: { fleet: 10, staff: 3 } },
      { id: 'e52-b', label: 'Μέτρια αύξηση', labelEn: 'Moderate push', description: 'Λίγες κρατήσεις', descriptionEn: 'A few bookings', icon: '📈', effects: { fleet: -3, budget: 700, rating: 3 } },
      { id: 'e52-c', label: 'Παρατηρώ', labelEn: 'Watch', description: 'Δεν κάνω κάτι', descriptionEn: 'Do nothing', icon: '👀', effects: {} },
    ],
  },
  {
    id: 'e-53', title: 'Δωρεά από Πελάτη', titleEn: 'Customer Gratitude',
    description: 'Ενθουσιασμένος πελάτης αφήνει 5★ review + δώρο (κρασί) για την ομάδα!', descriptionEn: 'Excited customer leaves 5★ review + gift for the team!',
    icon: '🎁', severity: 'info', category: 'random', probability: 0.2, requiresRating: 75,
    choices: [
      { id: 'e53-a', label: 'Ευχαρίστησε δημόσια', labelEn: 'Thank publicly', description: 'Post στα social', descriptionEn: 'Social media post', icon: '📢', effects: { rating: 5, staff: 1 } },
      { id: 'e53-b', label: 'Πες ευχαριστώ', labelEn: 'Say thanks', description: 'Προσωπική ευχαριστία', descriptionEn: 'Personal thanks', icon: '🙏', effects: { rating: 3 } },
    ],
  },
  {
    id: 'e-54', title: 'Τεχνολογική Αναβάθμιση', titleEn: 'Tech Upgrade',
    description: 'Νέο σύστημα κρατήσεων διαθέσιμο. Ακριβό αλλά αποδοτικό.', descriptionEn: 'New reservation system available. Expensive but efficient.',
    icon: '💻', severity: 'opportunity', category: 'random', probability: 0.3, minDay: 10,
    choices: [
      { id: 'e54-a', label: 'Πλήρες upgrade', labelEn: 'Full upgrade', description: 'Νέο σύστημα τώρα', descriptionEn: 'New system now', icon: '🚀', effects: { budget: -800, time: -4, staff: 2, rating: 8 }, requiredResources: { budget: 800 } },
      { id: 'e54-b', label: 'Μερική αναβάθμιση', labelEn: 'Partial upgrade', description: 'Μόνο τα βασικά', descriptionEn: 'Basics only', icon: '📈', effects: { budget: -300, time: -2, staff: 1, rating: 3 } },
      { id: 'e54-c', label: 'Κράτα το παλιό', labelEn: 'Keep old system', description: 'Λειτουργεί ακόμα', descriptionEn: 'Still works', icon: '🤷', effects: { rating: -2 } },
    ],
  },
  {
    id: 'e-55', title: 'Πτήση Ακυρώθηκε', titleEn: 'Flight Cancelled',
    description: '3 πτήσεις ακυρώθηκαν! 15 πελάτες δεν ήρθαν, 10 ατυχοποιημένοι ψάχνουν ταξί/αυτοκίνητο.', descriptionEn: '3 flights cancelled! 15 no-shows, 10 stranded looking for a car.',
    icon: '✈️', severity: 'warning', category: 'random', probability: 0.3,
    choices: [
      { id: 'e55-a', label: 'Βοήθα τους αφιχθέντες', labelEn: 'Help arrivals', description: 'Δώσε αυτοκίνητα γρήγορα', descriptionEn: 'Provide cars fast', icon: '🤝', effects: { fleet: -5, budget: 600, rating: 10, time: -3 } },
      { id: 'e55-b', label: 'Κανονικές τιμές', labelEn: 'Regular prices', description: 'Κάντο κανονικά', descriptionEn: 'Business as usual', icon: '💶', effects: { fleet: -3, budget: 400, rating: 3 } },
      { id: 'e55-c', label: 'Αύξηση τιμών (surge)', labelEn: 'Surge pricing', description: 'Λόγω μεγάλης ζήτησης', descriptionEn: 'Due to high demand', icon: '📈', effects: { fleet: -2, budget: 500, rating: -8 } },
    ],
  },
  // ═══ MORE CUSTOMER ═══
  {
    id: 'e-06', title: 'Μακροχρόνια Ενοικίαση', titleEn: 'Long-Term Rental',
    description: 'Εταιρεία ζητά 3 αυτοκίνητα για 3 μήνες. Σταθερό εισόδημα.', descriptionEn: 'Company wants 3 cars for 3 months. Stable income.',
    icon: '📋', severity: 'opportunity', category: 'customer', probability: 0.3, minDay: 10,
    choices: [
      { id: 'e06-a', label: 'Αποδοχή', labelEn: 'Accept', description: 'Σταθερό εισόδημα 3 μηνών', descriptionEn: '3 months steady income', icon: '✅', effects: { fleet: -3, budget: 2500, rating: 5 }, requiredResources: { fleet: 5 } },
      { id: 'e06-b', label: '1 αυτοκίνητο μόνο', labelEn: '1 car only', description: 'Μικρότερη δέσμευση', descriptionEn: 'Less commitment', icon: '🤝', effects: { fleet: -1, budget: 800, rating: 2 } },
      { id: 'e06-c', label: 'Άρνηση', labelEn: 'Decline', description: 'Χρειάζεσαι τα αυτοκίνητα', descriptionEn: 'Need the cars', icon: '❌', effects: {} },
    ],
  },
  {
    id: 'e-07', title: 'Αθλητική Ομάδα', titleEn: 'Sports Team',
    description: 'Αθλητική ομάδα χρειάζεται 2 vans για 1 εβδομάδα. Μεγάλη δημοσιότητα.', descriptionEn: 'Sports team needs 2 vans for 1 week. Great publicity.',
    icon: '⚽', severity: 'opportunity', category: 'customer', probability: 0.2, minDay: 5,
    choices: [
      { id: 'e07-a', label: 'Δωρεάν+Χορηγία', labelEn: 'Free+Sponsorship', description: 'Logo στα vans δωρεάν', descriptionEn: 'Free with logo on vans', icon: '📢', effects: { fleet: -2, budget: -100, rating: 15 } },
      { id: 'e07-b', label: 'Κανονική τιμή', labelEn: 'Regular price', description: 'Βγάλε κέρδος', descriptionEn: 'Make profit', icon: '💶', effects: { fleet: -2, budget: 600, rating: 3 } },
    ],
  },
  // ═══ MORE FLEET ═══
  {
    id: 'e-14', title: 'Ανάκληση Αυτοκινήτων', titleEn: 'Car Recall',
    description: 'Κατασκευαστής ανακαλεί 3 αυτοκίνητα για έλεγχο αερόσακων.', descriptionEn: 'Manufacturer recalls 3 cars for airbag check.',
    icon: '⚠️', severity: 'critical', category: 'fleet', probability: 0.2, minDay: 7,
    choices: [
      { id: 'e14-a', label: 'Άμεση ανάκληση', labelEn: 'Immediate recall', description: 'Στείλε τώρα', descriptionEn: 'Send now', icon: '🏃', effects: { fleet: -3, time: -3, rating: 5 } },
      { id: 'e14-b', label: 'Σταδιακά', labelEn: 'Gradually', description: 'Ένα-ένα', descriptionEn: 'One by one', icon: '📅', effects: { fleet: -1, time: -1 } },
    ],
  },
  {
    id: 'e-15', title: 'Λάστιχο Σκασμένο', titleEn: 'Flat Tire',
    description: 'Πελάτης τηλεφωνεί: σκασμένο λάστιχο στον δρόμο, 30km μακριά.', descriptionEn: 'Customer calls: flat tire on road, 30km away.',
    icon: '🛞', severity: 'warning', category: 'fleet', probability: 0.5,
    choices: [
      { id: 'e15-a', label: 'Στείλε οδική βοήθεια', labelEn: 'Send roadside assist', description: 'Γρήγορη βοήθεια', descriptionEn: 'Quick help', icon: '🚐', effects: { budget: -120, time: -2, staff: -1, rating: 5 } },
      { id: 'e15-b', label: 'Στείλε αντικατάσταση', labelEn: 'Send replacement car', description: 'Αντικατέστησε το αυτοκίνητο', descriptionEn: 'Replace the car', icon: '🚗', effects: { fleet: -1, budget: -200, time: -3, staff: -1, rating: 8 } },
      { id: 'e15-c', label: 'Καθοδήγησε τηλεφωνικά', labelEn: 'Guide by phone', description: 'Πες του πώς να αλλάξει', descriptionEn: 'Tell them how to change it', icon: '📱', effects: { time: -1 }, risk: { probability: 0.5, bonusEffects: { rating: 3 }, penaltyEffects: { rating: -8 }, bonusText: 'Τα κατάφερε!', penaltyText: 'Ο πελάτης θύμωσε — δεν ήξερε!' } },
    ],
  },
  // ═══ DAILY ROUTINE ═══
  {
    id: 'e-60', title: 'Ήρεμη Μέρα', titleEn: 'Quiet Day',
    description: 'Μια σχετικά ήρεμη μέρα. Τι θα κάνεις με τον χρόνο;', descriptionEn: 'A relatively quiet day. What to do with the time?',
    icon: '☀️', severity: 'info', category: 'random', probability: 0.3,
    choices: [
      { id: 'e60-a', label: 'Συντήρηση στόλου', labelEn: 'Fleet maintenance', description: 'Βελτίωσε τα αυτοκίνητα', descriptionEn: 'Improve cars', icon: '🔧', effects: { fleet: 2, time: -4, budget: -100 } },
      { id: 'e60-b', label: 'Εκπαίδευση', labelEn: 'Training', description: 'Εκπαίδεψε την ομάδα', descriptionEn: 'Train the team', icon: '📚', effects: { staff: 1, time: -3 } },
      { id: 'e60-c', label: 'Χαλάρωσε', labelEn: 'Relax', description: 'Η ομάδα χρειάζεται ξεκούραση', descriptionEn: 'Team needs rest', icon: '☕', effects: { staff: 1, rating: 2 } },
    ],
  },
  {
    id: 'e-61', title: 'Πρωινά Παραδοτέα', titleEn: 'Morning Deliveries',
    description: '8 αυτοκίνητα πρέπει να παραδοθούν μέχρι τις 10:00. Πίεση!', descriptionEn: '8 cars must be delivered by 10:00. Pressure!',
    icon: '🏃', severity: 'warning', category: 'random', probability: 0.6,
    choices: [
      { id: 'e61-a', label: 'Κανονικά', labelEn: 'Normal pace', description: 'Προλαβαίνεις 6/8', descriptionEn: 'Can manage 6/8', icon: '🚗', effects: { time: -4, fleet: -6, budget: 500, rating: -2 } },
      { id: 'e61-b', label: 'Γρήγορα — extra ομάδα', labelEn: 'Fast — extra team', description: 'Βάλε extra κόσμο', descriptionEn: 'Add extra staff', icon: '⚡', effects: { time: -5, staff: -2, fleet: -8, budget: 700, rating: 5 } },
      { id: 'e61-c', label: 'Ανακατάνιμε ώρες', labelEn: 'Reschedule some', description: 'Ζήτα αλλαγή ωρών', descriptionEn: 'Request time changes', icon: '📞', effects: { time: -2, fleet: -4, budget: 350, rating: -3 } },
    ],
  },
];

// ─── Event Selection ─────────────────────────────────────────

/**
 * Select a random event appropriate for the current game state.
 * Filters by day requirements and resource requirements.
 * Uses weighted random based on probability.
 */
export function selectEvent(
  day: number,
  resources: { fleet: number; rating: number },
  usedEventIds: Set<string>,
): GameEvent {
  // Filter eligible events
  let eligible = EVENT_DECK.filter(e => {
    if (usedEventIds.has(e.id) && EVENT_DECK.length > usedEventIds.size + 5) return false;
    if (e.minDay && day < e.minDay) return false;
    if (e.maxDay && day > e.maxDay) return false;
    if (e.requiresRating && resources.rating < e.requiresRating) return false;
    if (e.requiresFleet && resources.fleet < e.requiresFleet) return false;
    return true;
  });

  // Fallback: allow repeats if too few eligible
  if (eligible.length < 3) {
    eligible = EVENT_DECK.filter(e => {
      if (e.minDay && day < e.minDay) return false;
      if (e.maxDay && day > e.maxDay) return false;
      return true;
    });
  }

  // Weighted random selection
  const totalWeight = eligible.reduce((sum, e) => sum + e.probability, 0);
  let roll = Math.random() * totalWeight;
  for (const event of eligible) {
    roll -= event.probability;
    if (roll <= 0) return event;
  }

  return eligible[eligible.length - 1] || EVENT_DECK[0];
}
