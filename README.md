# 🍷 Mijn Wijnkelder — Sommelier & Kelderbeheer

Een moderne, intuïtieve webapplicatie voor wijnliefhebbers om hun complete wijnkelder, klimaatkasten en drinkvensters visueel en interactief te beheren.

🌐 **Live applicatie:** [https://feynman-wines.github.io/Wijnkelder-app/](https://feynman-wines.github.io/Wijnkelder-app/)

---

## ✨ Belangrijkste Functies

### 1. 🤖 AI Sommelier & Etiketscanner
- **Directe Camera-integratie:** Maak direct een foto van een wijnetiket met de camera op je smartphone of kies een foto uit je fotobibliotheek.
- **Automatische herkenning:** Analyseert wijnhuis, druivenras, oogstjaar, Vivino-score en stelt automatisch een bewaartermijn en serveertemperatuur in.

### 2. 🎲 Sommelier Keuzehulp — *"Wat drinken we vanavond?"*
- Vind binnen enkele seconden de perfecte fles op basis van:
  - 🥩 Gerecht & Spijscombinatie (Rood vlees, vis, pasta, kaas, wild, etc.)
  - ⏳ Drinkstatus (Nu op piek, drinken voor 2026, speciale gelegenheid)
  - 🍷 Smaakprofiel & Kleur (Vol & krachtig rood, fris wit, mousserend)
  - 🎲 "Verras me" functie met live ontkurk-suggesties.

### 3. 📊 Interactieve Kelderstatistieken
- **Totale Kelderwaarde:** Realistische berekening van de winkelwaarde en gemiddelde flesprijs.
- **Cirkeldiagram (Donut Chart):** Verhouding tussen Rood, Wit & Rosé, Mousserend en Overig.
- **Jaargangen Staafdiagram:** Historisch overzicht van alle oogstjaren in je kelder.
- **Herkomst & Landen:** Verdeling over Frankrijk, Italië, Spanje en de rest van de wereld.
- **Waardesegmenten & Top Druiven:** Direct inzicht in prijsklassen en favoriete druivenrassen.
- **Alles is klikbaar:** Klik op een druif (*bijv. Malbec*), land of jaargang om direct alle bijbehorende flessen te bekijken.

### 4. 🗄️ Klimaatkasten & Slimme Ruilsuggesties (88 plekken)
- Beheer van **Klimaatkast 1** (Plank 1 t/m 10) en **Klimaatkast 2** (Plank 11 t/m 14) + *Donker / Rustig* buiten de kasten.
- **Slimme Ruilsuggesties:** Wanneer de klimaatkast 100% vol is en je een bewaarwijn wilt toevoegen, adviseert de sommelier welke fles met kortere bewaarhorizon veilig naar *Donker/Rustig* kan verhuizen.

### 5. 📅 Wijnkalender & Drinkvensters
- Overzicht per jaar van welke wijnen op dronk zijn.
- **Urgentiewaarschuwingen (2026):** Voorkom dat topflessen over hun hoogtepunt raken.

### 6. 📝 Proefnotities & Ontkurkt Archief
- Registreer ontkurkte flessen met 1 klik.
- Voeg persoonlijke proefnotities, beoordelingen (★ 1–5), serveerervaringen en datum toe.
- Wijnen opnieuw ingekocht? Met 1 klik herstel je ze vanuit het archief weer naar de actieve voorraad.

### 7. 💾 Back-up & Excel Export
- **Excel (.xlsx):** Exporteer je complete kelderbestand direct naar een professioneel opgemaakt Excel-sheet.
- **JSON Back-up & Herstel:** Veilige lokale back-ups maken en importeren.

### 8. 📱 Mobile First (Duimvriendelijk)
- Op smartphones voorzien van een vaste **Bottom Navigation Bar** onderaan het scherm voor soepele bediening met één hand.
- Op laptops en tablets een rijk, breed overzichtsdashboard.

---

## 🚀 Technologieën

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Modern dark mode design)
- **Iconen:** Lucide React
- **Export Engine:** SheetJS (XLSX)
- **Hosting & CI/CD:** GitHub Pages & GitHub Actions

---

## 🛠️ Lokaal Ontwikkelen

1. **Repository klonen:**
   ```bash
   git clone https://github.com/feynman-wines/Wijnkelder-app.git
   cd Wijnkelder-app
   ```

2. **Afhankelijkheden installeren:**
   ```bash
   npm install
   ```

3. **Ontwikkelserver starten:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in je browser.

4. **Productie Build & Linting:**
   ```bash
   npm run lint
   npm run build
   ```

---

## 📄 Licentie

Gemaakt voor persoonlijk en gedeeld wijnkelderbeheer. Vrij te gebruiken en aan te passen. Proost! 🍷
