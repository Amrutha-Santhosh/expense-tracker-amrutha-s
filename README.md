# 💰 Expense Tracker

A simple, responsive Expense Tracker web application built with **HTML**, **CSS**, and **vanilla JavaScript**. No external libraries or frameworks required.

## Features

- **Add Transactions** — Record income or expense with amount, category, date, and description.
- **Edit & Delete** — Modify or remove any transaction.
- **Dashboard Summary** — View total income, total expenses, and current balance at a glance.
- **Filters** — Filter transactions by type (income/expense), category, or month.
- **Local Storage** — All data persists in the browser across page refreshes.
- **Responsive Design** — Works on desktop, tablet, and mobile screens.
- **Category Chart** — Visual donut chart showing category-wise expense breakdown.
- **Monthly Summary** — Month-by-month income vs. expense overview.
- **Validation** — Inline error messages for all form fields.

## How to Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/<Amrutha-Santhosh>/expense-tracker-amrutha-s.git
   ```
2. **Open the app**
   - Navigate to the project folder.
   - Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).

   **Or** use a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js (npx)
   npx serve .
   ```
   Then visit `http://localhost:8000` in your browser.

3. **Start tracking!**
   - Select Income or Expense, fill in the details, and click **Add Transaction**.

## Project Structure

```
expense-tracker-amrutha-s/
├── index.html    # Main HTML page
├── style.css     # Styles and responsive layout
├── script.js     # Application logic
└── README.md     # This file
```

## Technologies Used

- HTML5
- CSS3 (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6+)
- Canvas API (for the donut chart)
- Browser Local Storage

## Browser Support

Works on all modern browsers: Chrome, Firefox, Edge, Safari.
