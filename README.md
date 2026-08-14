# 🔥 KaamSangBsdk

_"BSDK sang, kaam sang!"_

---

## 🏠 About

**KaamSangBsdk** is the ultimate duty management system for bachelor flatmates who want to avoid work but can't! It automatically schedules, displays, and tracks shared household responsibilities with a **bold, funny, and unapologetic** attitude.

### The Name

- **Kaam** = Work (काम)
- **Sang** = Together (संग)
- **BSDK** = The OG slang (Bhenchod)

### The Vibe

- 🔥 Maximum bachelor energy
- 😂 Zero filter fun
- 💪 Legendary humor
- 📊 Fair duties (because nobody wants to be the only BSDK doing everything!)

---

## 👥 The BSDK Squad

| ID  | Name   | Title        |
| --- | ------ | ------------ |
| 1   | Anuj   | Bada BSDK    |
| 2   | Gaurav | Chota BSDK   |
| 3   | Om     | Medium BSDK  |
| 4   | Chandu | Special BSDK |
| 5   | Atherv | Naya BSDK    |

---

## 🎯 Tasks & Frequencies

| Task                    | Icon | Frequency    | Type      |
| ----------------------- | ---- | ------------ | --------- |
| Bring Water             | 🚰   | Every 2 days | Recurring |
| Clean Bathroom & Toilet | 🧹   | Every 3 days | Recurring |
| Throw Garbage           | 🗑️   | Every day    | Recurring |

---

## 📅 Schedule Period

**17 August 2026 → 17 August 2027**

---

## 🚀 Features

### Core Scheduling

- ✅ **Independent Rotations** - Each task has its own fair rotation
- ✅ **No Double Duty** - One person, one task per day (with 3 tasks & 5 people)
- ✅ **Smart Conflict Resolution** - Fair algorithm to resolve conflicts
- ✅ **Deterministic Schedule** - Same result on all devices
- ✅ **One Year Coverage** - 365 days of BSDK planning

### User Interface

- ✅ **Personal Dashboard** - See your duties for today
- ✅ **Person Selector** - Choose who you are (remembered in browser)
- ✅ **Flat Schedule** - See everyone's duties at a glance
- ✅ **Full Timetable** - Complete yearly schedule
- ✅ **Calendar View** - Monthly overview with task indicators
- ✅ **Next Duty** - See your upcoming responsibility
- ✅ **Dark Theme** - Badass dark mode by default

### Data Management

- ✅ **Supabase Cloud Storage** - Shared schedule across all devices
- ✅ **Completion Tracking** - Mark tasks as done
- ✅ **Statistics Dashboard** - Fairness reports and completion rates
- ✅ **LocalStorage** - Remembers your selected person

---

## 🧠 How It Works

### Scheduling Algorithm

1. **Independent Rotations**
   - Each task has its own counter tracking the current person in rotation
   - Tasks advance independently when assigned

2. **Ideal Assignments**
   - For each date, determine which tasks are due
   - Assign the current person from each task's rotation

3. **Conflict Detection**
   - Check if any person is assigned to multiple tasks on the same date
   - Identify tasks that need reassignment

4. **Conflict Resolution**
   - Find available people (not already assigned that day)
   - Score candidates based on:
     - Fairness (how many times they've done the task)
     - Recency (when they last did the task)
     - Rotation distance (how far from ideal position)
   - Assign the best candidate

5. **Schedule Storage**
   - Final assignments are stored in Supabase
   - All devices read from the same source

### Key Rules

- ✅ **Independent Tasks** - Each task has its own rotation
- ✅ **Fair Distribution** - Tasks are distributed evenly among residents
- ✅ **No Double Duty** - One responsibility per person per day
- ✅ **Deterministic** - Same schedule generated on all devices

---

## 📊 Technology Stack

| Component         | Technology                |
| ----------------- | ------------------------- |
| Frontend          | HTML5                     |
| Styling           | Tailwind CSS + Custom CSS |
| Logic             | Vanilla JavaScript        |
| Database          | Supabase Free             |
| Local Preferences | LocalStorage              |
| Version Control   | Git                       |
| Hosting           | GitHub Pages              |

---

## 🔧 Configuration

Edit `js/supabase.js` to customize:

```javascript
const FLAT_CONFIG = {
  startDate: "2026-08-17",
  endDate: "2027-08-17",
  people: ["Anuj", "Gaurav", "Om", "Chandu", "Atherv"],
  responsibilities: [
    { id: "water", name: "Bring Water", interval: 2, icon: "🚰" },
    {
      id: "bathroom",
      name: "Clean Bathroom & Toilet",
      interval: 3,
      icon: "🧹",
    },
    { id: "garbage", name: "Throw Garbage", interval: 1, icon: "🗑️" },
  ],
};
```

---

## 📁 Project Structure

```
kaamsangbsdk/
├── index.html          # Main dashboard
├── timetable.html      # Full timetable view
├── calendar.html       # Calendar view
├── statistics.html     # Statistics dashboard
├── css/
│   └── style.css      # Global styles (Dark BSDK Theme)
├── js/
│   ├── app.js         # Main app logic (BSDK flavored)
│   ├── scheduler.js   # Scheduling engine
│   ├── conflictResolver.js # Conflict resolution
│   ├── supabase.js    # Supabase integration
│   ├── calendar.js    # Calendar view logic
│   ├── statistics.js  # Statistics logic
│   └── timetable.js   # Timetable logic
├── assets/
│   └── (icons, images)
└── README.md          # This file
```

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Supabase account (free tier)
- Basic understanding of HTML/CSS/JavaScript

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/kaamsangbsdk.git
   cd kaamsangbsdk
   ```

2. **Set up Supabase**
   - Create a free Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Update the `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/supabase.js`

3. **Create Database Tables**
   Run these SQL commands in the Supabase SQL Editor:

   ```sql
   -- People table
   CREATE TABLE people (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- Responsibilities table
   CREATE TABLE responsibilities (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       interval_days INTEGER NOT NULL,
       icon TEXT
   );

   -- Assignments table
   CREATE TABLE assignments (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       date DATE NOT NULL,
       responsibility_id TEXT NOT NULL,
       person_id TEXT NOT NULL,
       assignment_type TEXT DEFAULT 'scheduled',
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(date, responsibility_id)
   );

   -- Completions table
   CREATE TABLE completions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       assignment_id UUID REFERENCES assignments(id),
       completed BOOLEAN DEFAULT FALSE,
       completed_at TIMESTAMP,
       completed_by TEXT,
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(assignment_id)
   );
   ```

4. **Deploy to GitHub Pages**
   ```bash
   git add .
   git commit -m "🔥 KaamSangBsdk - Initial Deployment"
   git push origin main
   ```

   - Enable GitHub Pages in your repository settings

---

## 🎯 Taglines

```
"BSDK sang, kaam sang!"
"BSDK bano, kaam karo!"
"Jab kaam ho, toh BSDK hona chahiye!"
"Kaam sang BSDK, re baba!"
"BSDK banega kaam!"
```

---

## 🤣 Why This Name?

Because every bachelor flat has that one BSDK who never does work. This app ensures fair distribution of duties so everyone becomes a responsible BSDK!

---

## 🧪 Testing

### Basic Tests

- ✅ Tasks occur at correct frequencies
- ✅ All dates within schedule period
- ✅ Each task has one assigned person

### Conflict Tests

- ✅ No person has multiple tasks on same day
- ✅ Conflicts are resolved fairly
- ✅ Task distribution remains balanced

### Fairness Tests

- ✅ Each task's assignments are within 1 of each other
- ✅ No person is consistently favored
- ✅ Completion tracking works correctly

---

## 🔮 Future Features

- PWA (Installable on smartphones)
- Push notifications
- Duty swapping
- Manual overrides
- CSV export
- Multiple flat configurations

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Author

Your Name - [GitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Built for real flatmates making household chores easier
- Thanks to Supabase for the generous free tier
- Tailwind CSS for making styling responsive and clean
- The BSDK squad for inspiration

---

**"BSDK sang, kaam sang! No one gets left behind!"** 🔥

---

## 🎨 Brand Assets

### Logo Concept

```
🔥 + 👥 + 💪 = KaamSangBsdk
```

### Color Scheme

- **Primary:** #FF3B30 (Red - Bold/Badass)
- **Secondary:** #1A1A2E (Dark - Night vibe)
- **Accent:** #FFD700 (Gold - Premium)
- **Background:** #0F0F1A (Dark mode default)

---

**Made with ❤️ & 😂 for the ultimate BSDK squad**

````

---

## ✅ **All Files Updated Summary**

| File | Status | Changes |
|------|--------|---------|
| `index.html` | ✅ Updated | Full BSDK branding, dark theme, hero section |
| `timetable.html` | ✅ Updated | BSDK themed, dark colors, fun elements |
| `calendar.html` | ✅ Updated | BSDK theme, dark calendar, modal |
| `statistics.html` | ✅ Updated | BSDK stats, dark theme, fun elements |
| `css/style.css` | ✅ Updated | Complete dark theme, BSDK styles |
| `js/app.js` | ✅ Updated | BSDK greetings, fun messages |
| `README.md` | ✅ Updated | Full documentation with BSDK flavor |

---

## 🚀 **Deploy Now!**

Your **KaamSangBsdk** project is complete and ready to deploy!

```bash
# Push to GitHub
git add .
git commit -m "🔥 KaamSangBsdk - Complete Project with Dark Theme"
git push origin main

# Enable GitHub Pages
# Settings → Pages → main branch → Save
````
