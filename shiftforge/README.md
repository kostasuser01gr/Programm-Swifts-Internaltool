# ShiftForge — Εσωτερικό Εργαλείο Διαχείρισης Βαρδιών

> **100% Δωρεάν | Cross-Platform (iOS, Android, Web, Desktop) | Self-Hosted | Χωρίς Vendor Lock-in**

## Αρχιτεκτονική

| Layer | Τεχνολογία | Κόστος |
|-------|-----------|--------|
| Frontend | **Flutter 3.x** (Dart) — iOS, Android, Web, macOS, Windows, Linux | $0 |
| Backend | **PocketBase** (SQLite, Auth, Real-time SSE, REST API) | $0 |
| AI Copilot | **Ollama** (Llama 3.1 8B / Mistral 7B — self-hosted LLM) | $0 |
| Hosting | Oracle Cloud Free Tier (4 ARM CPUs, 24GB RAM, always free) | $0 |
| Web Deploy | GitHub Pages / Cloudflare Pages | $0 |
| CI/CD | GitHub Actions | $0 |
| Push Notifications | Firebase Cloud Messaging (free tier) | $0 |
| **Σύνολο** | | **$0 / μήνα** |

### Γιατί αυτή η αρχιτεκτονική;

✅ **Ένα codebase** — Flutter κάνει compile σε iOS, Android, Web, Desktop  
✅ **Χωρίς vendor lock-in** — PocketBase = open source, δεδομένα σε SQLite  
✅ **Full SQL** — JOINs, aggregates, complex queries (δεν είναι Firestore)  
✅ **Απλοί κανόνες ασφαλείας** — filter-based API rules > Firestore security rules  
✅ **Δωρεάν AI** — Ollama τρέχει τοπικά, χωρίς API keys ή χρεώσεις  
✅ **Offline support** — Hive τοπικό storage, sync on reconnect  

---

## Γρήγορη Εκκίνηση

### 1. Εγκατάσταση Flutter
```bash
# macOS
brew install flutter

# Linux
sudo snap install flutter --classic

# Windows
choco install flutter
```

### 2. Εκκίνηση Backend (PocketBase + Ollama)
```bash
cd shiftforge
docker compose up -d

# Ή χωρίς Docker:
# 1. Κατέβασε PocketBase: https://pocketbase.io/docs/
# 2. ./pocketbase serve
# 3. Εισαγωγή schema: backend/pocketbase/pb_schema.json
```

### 3. Εγκατάσταση AI Model
```bash
docker exec shiftforge-ai ollama pull llama3.1:8b
```

### 4. Εκκίνηση App
```bash
cd shiftforge
flutter pub get

# Web
flutter run -d chrome

# iOS (Mac μόνο)
flutter run -d ios

# Android
flutter run -d android

# Desktop
flutter run -d macos   # ή windows / linux
```

### 5. Deploy
```bash
# Web → GitHub Pages (free)
flutter build web --release
# Τα αρχεία είναι στο build/web/

# Android APK
flutter build apk --release

# iOS (Χρειάζεται Mac + Apple Developer Account)
flutter build ios --release
```

---

## Κωδικοί Βαρδιών (ΩΡΑΡΙΑ)

| Κωδικός | Ώρες | Διάρκεια | Τύπος |
|---------|------|----------|-------|
| 202 | 06:00 – 14:00 | 8h | 🌅 Πρωί |
| 203 | 07:00 – 15:00 | 8h | 🌅 Πρωί |
| 403 | 07:30 – 15:30 | 8h | 🌅 Πρωί |
| 301 | 08:00 – 16:00 | 8h | ☀️ Ημέρα |
| 206 | 09:00 – 17:00 | 8h | ☀️ Ημέρα |
| 208 | 10:00 – 18:00 | 8h | ☀️ Ημέρα |
| 210 | 11:00 – 19:00 | 8h | 🌤️ Μεσημέρι |
| 211 | 12:00 – 20:00 | 8h | 🌤️ Μεσημέρι |
| 404 | 12:30 – 20:30 | 8h | 🌤️ Μεσημέρι |
| 212 | 13:00 – 21:00 | 8h | 🌇 Απόγευμα |
| 405 | 13:30 – 21:30 | 8h | 🌇 Απόγευμα |
| 213 | 14:00 – 22:00 | 8h | 🌇 Απόγευμα |
| 406 | 14:30 – 22:30 | 8h | 🌇 Απόγευμα |
| 214 | 15:00 – 23:00 | 8h | 🌙 Βράδυ |
| 402 | 15:30 – 23:30 | 8h | 🌙 Βράδυ |
| 332 | 16:00 – 00:00 | 8h | 🌙 Βράδυ |
| 331 | 16:30 – 00:30 | 8h | 🌙 Βράδυ |
| 333 | 17:00 – 01:00 | 8h | 🌙 Βράδυ |
| 217 | 23:00 – 07:00 | 8h | 🌑 Νύχτα |
| R | ΡΕΠΟ | 0h | 🏖️ Ανάπαυση |

---

## Δομή Αρχείων

```
shiftforge/
├── lib/
│   ├── main.dart                      # Entry point
│   ├── app.dart                       # Router + Material theme
│   ├── models/
│   │   └── models.dart                # All data models + enums
│   ├── services/
│   │   ├── pocketbase_client.dart     # PB singleton + auth
│   │   ├── schedule_service.dart      # CRUD for all collections
│   │   ├── chat_service.dart          # Real-time chat
│   │   └── ollama_service.dart        # AI copilot (free LLM)
│   ├── providers/
│   │   ├── auth_provider.dart         # Auth state (Riverpod)
│   │   └── schedule_provider.dart     # Schedule + constraint engine
│   ├── screens/
│   │   ├── auth/login_screen.dart
│   │   ├── dashboard/dashboard_screen.dart
│   │   ├── schedule/schedule_screen.dart  # Weekly grid + shift picker
│   │   ├── staff/staff_directory_screen.dart
│   │   ├── chat/channel_list_screen.dart
│   │   ├── ai_copilot/copilot_screen.dart
│   │   ├── requests/requests_screen.dart
│   │   ├── settings/settings_screen.dart
│   │   ├── analytics/analytics_screen.dart
│   │   └── admin/
│   │       ├── audit_log_screen.dart
│   │       └── shift_codes_screen.dart
│   ├── widgets/
│   │   └── app_shell.dart             # Responsive sidebar/bottom nav
│   └── utils/
│       ├── theme.dart                 # Material 3 theme
│       └── constants.dart             # App-wide constants
├── backend/
│   ├── pocketbase/
│   │   └── pb_schema.json             # 13 collections + RBAC rules
│   └── seed/
│       └── seed_data.json             # 23 employees, 20 shift codes, 161 assignments
├── deploy/
│   └── setup-server.sh               # One-click Oracle Cloud setup
├── docker-compose.yml                 # PocketBase + Ollama
├── pubspec.yaml                       # Flutter dependencies
└── README.md                          # This file
```

---

## Ρόλοι & Δικαιώματα (RBAC)

| Ενέργεια | Owner | Admin | Manager | Staff | Viewer |
|----------|:-----:|:-----:|:-------:|:-----:|:------:|
| Δημιουργία/Τροποποίηση Προγράμματος | ✅ | ✅ | ✅ | ❌ | ❌ |
| Έγκριση Αδειών/Ανταλλαγών | ✅ | ✅ | ✅ | ❌ | ❌ |
| Διαχείριση Προσωπικού | ✅ | ✅ | ❌ | ❌ | ❌ |
| Διαχείριση Κωδικών Βαρδιών | ✅ | ✅ | ❌ | ❌ | ❌ |
| Αναλυτικά / Στατιστικά | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ιστορικό Ενεργειών (Audit) | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI Copilot | ✅ | ✅ | ✅ | ✅ | ❌ |
| Chat | ✅ | ✅ | ✅ | ✅ | ❌ |
| Αιτήσεις Αδειών/Ανταλλαγών | ✅ | ✅ | ✅ | ✅ | ❌ |
| Εξαγωγή PDF/Excel | ✅ | ✅ | ✅ | ❌ | ❌ |
| Προβολή Δικού του Προγράμματος | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Κανόνες Βαρδιών (Constraint Engine)

Ο ενσωματωμένος constraint engine ελέγχει αυτόματα:

| Κανόνας | Τιμή | Περιγραφή |
|---------|------|-----------|
| Max ώρες / εβδομάδα | 48h | Εργατική νομοθεσία |
| Min ρεπό / εβδομάδα | 1 | Υποχρεωτική ανάπαυση |
| Max συνεχόμενες ημέρες | 6 | Χωρίς ρεπό |
| Min ανάπαυση μεταξύ βαρδιών | 11h | Μεταξύ τέλους και αρχής |

Πρόσθετοι κανόνες (AI-assisted):
- Min κάλυψη ανά time slot
- Δίκαιη κατανομή νυχτερινών
- Δίκαιη κατανομή Σ/Κ
- Skill requirements ανά θέση

---

## Ιδέες Αναβάθμισης & Roadmap

### Phase 2 — Βελτιώσεις Πυρήνα (Q2 2026)

1. **Drag & Drop Scheduling** — Σύρε βάρδιες στο grid αντί dropdown picker
2. **Schedule Templates** — Αποθήκευση/φόρτωση προτύπων εβδομάδας
3. **Copy Patterns** — Αντιγραφή 2/4-εβδομαδιαίων μοτίβων
4. **Undo/Redo Stack** — Αναίρεση/Επανάληψη ενεργειών στο πρόγραμμα
5. **Multi-Week View** — Προβολή 2/4 εβδομάδων ταυτόχρονα
6. **Conflict Resolver** — Αυτόματη επίλυση με AI + fallback options
7. **PDF Export** — Εξαγωγή εβδομαδιαίου σε PDF (εκτυπώσιμο A4/A3)
8. **Excel Import/Export** — Αμφίδρομη sync με υπάρχοντα Excel αρχεία
9. **Push Notifications** — Ειδοποίηση στо κινητό όταν δημοσιεύεται πρόγραμμα
10. **Offline Mode** — Πλήρης λειτουργικότητα χωρίς internet, sync on reconnect

### Phase 3 — Εξελιγμένα Features (Q3 2026)

11. **Biometric Check-in** — Προσέλευση μέσω Face ID / Fingerprint / QR
12. **GPS Geofencing** — Αυτόματο check-in εντός ακτίνας εργασίας
13. **Overtime Calculator** — Αυτόματος υπολογισμός υπερωριών + κόστους
14. **Payroll Integration** — Εξαγωγή δεδομένων για μισθοδοσία
15. **Leave Calendar** — Ημερολόγιο αδειών ολόκληρου προσωπικού
16. **Availability Matrix** — Κάθε υπάλληλος δηλώνει διαθεσιμότητα
17. **Skill Matching** — Αυτόματη αντιστοίχιση δεξιοτήτων σε θέσεις
18. **Shift Bidding** — Υπάλληλοι "πλειοδοτούν" για προτιμώμενες βάρδιες
19. **Fatigue Score** — Αλγόριθμος κούρασης (ιστορικό βαρδιών + τύπος)
20. **Smart Coverage** — AI πρόβλεψη ζήτησης βάσει ιστορικών δεδομένων

### Phase 4 — Enterprise Features (Q4 2026)

21. **Multi-Department** — Πολλαπλά τμήματα / καταστήματα
22. **Department Transfer** — Μεταφορά υπαλλήλων μεταξύ τμημάτων
23. **External Calendar Sync** — Google Calendar / Apple Calendar sync
24. **Webhook Integrations** — Slack, Teams, Discord notifications
25. **Custom Reports Builder** — Drag & drop report creator
26. **Dashboard Widgets** — Customizable dashboard με widgets
27. **Dark/Light Themes** — Πλήρης υποστήριξη (ήδη ready)
28. **Accessibility** — VoiceOver/TalkBack, high contrast, font scaling
29. **Multi-Language** — Αγγλικά, Ελληνικά, Spanish, German κ.α.
30. **Audit Trail Export** — Εξαγωγή ιστορικού σε CSV/PDF

### Phase 5 — AI Εξελίξεις (2027)

31. **Auto-Schedule Generation** — Πλήρες αυτόματο πρόγραμμα σε 1 κλικ
32. **Predictive Absenteeism** — AI πρόβλεψη απουσιών
33. **Load Balancing AI** — Αυτόματη εξισορρόπηση φόρτου εργασίας
34. **Natural Language Queries** — "Ποιος δουλεύει αύριο;" σε chat
35. **Voice Commands** — Φωνητικές εντολές για αλλαγές βαρδιών
36. **Sentiment Analysis** — Ανάλυση ικανοποίησης από chat messages
37. **Burnout Detection** — AI ανίχνευση υπερκόπωσης προσωπικού
38. **Optimal Break Scheduling** — Βέλτιστα διαλείμματα ανά shift
39. **Training AI Model** — Fine-tuned model στα δικά σας δεδομένα
40. **Decision Explanation** — AI εξηγεί γιατί πρότεινε κάθε βάρδια

### Phase 6 — Νέες Πλατφόρμες & Integrations (2027)

41. **Apple Watch App** — Γρήγορη προβολή βάρδιας στο ρολόι
42. **Android Wear OS** — Companion app για smartwatch
43. **Home Screen Widget** — iOS/Android widget με σημερινή βάρδια
44. **Telegram Bot** — Ειδοποιήσεις + ερωτήσεις μέσω Telegram
45. **WhatsApp Integration** — Αποστολή προγράμματος μέσω WhatsApp
46. **QR Code Check-in** — Σάρωση QR κωδικού κατά την προσέλευση
47. **NFC Tag Check-in** — Tap NFC tag στην είσοδο
48. **Digital Signage** — Πρόγραμμα σε οθόνες τοίχου γραφείου
49. **Kiosk Mode** — Tablet σε κοινόχρηστο χώρο, αυτόματο logout
50. **API Documentation** — Public API (RESTful) για third-party integrations

---

## Deployment στο Oracle Cloud (Free Tier)

Βήμα-βήμα:

1. **Δημιουργία VM** — https://cloud.oracle.com → Compute → Create Instance
   - Shape: `VM.Standard.A1.Flex` (ARM, 4 CPU, 24GB RAM) — **ALWAYS FREE**
   - OS: Ubuntu 22.04
   - Networking: Assign public IP, open ports 8090, 11434, 80, 443

2. **SSH στο VM**
   ```bash
   ssh -i your-key.pem ubuntu@<YOUR-VM-IP>
   ```

3. **Τρέξε το Setup Script**
   ```bash
   bash deploy/setup-server.sh
   ```

4. **PocketBase Admin**
   - Πήγαινε: `http://<YOUR-VM-IP>:8090/_/`
   - Δημιούργησε admin account
   - Settings → Import Schema → `backend/pocketbase/pb_schema.json`

5. **Flutter Web Build**
   ```bash
   flutter build web --release \
     --dart-define=PB_URL=http://<YOUR-VM-IP>:8090 \
     --dart-define=OLLAMA_URL=http://<YOUR-VM-IP>:11434
   ```

6. **Deploy Web Build**
   - Upload `build/web/` σε GitHub Pages ή Cloudflare Pages (free)

---

## Ανοιχτά Θέματα (Ambiguities)

| # | Θέμα | Κατάσταση |
|---|------|-----------|
| 1 | ΜΑΡΝΟΓΙΑΝ εμφανίζεται 2 φορές — ίδιο ή διαφορετικό άτομο; | ⏳ Αναμονή |
| 2 | Κωδικοί βαρδιών + ώρες | ✅ Λύθηκε (εικόνα) |
| 3 | Ομάδα Α vs Β — τμήματα ή συμβάσεις; | ⏳ Αναμονή |
| 4 | R = ΡΕΠΟ (ανάπαυση) | ✅ Επιβεβαιώθηκε |

---

## License

Internal tool — private use only. No open source license.

## Tech Stack Credits

- [Flutter](https://flutter.dev/) — BSD 3-Clause
- [PocketBase](https://pocketbase.io/) — MIT
- [Ollama](https://ollama.com/) — MIT
- [Riverpod](https://riverpod.dev/) — MIT
