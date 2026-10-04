const STORAGE_KEY = 'expense_tracker_transactions';

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;

const form = document.getElementById('transaction-form');
const formTitle = document.getElementById('form-title');
const editIdInput = document.getElementById('edit-id');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const typeRadios = document.querySelectorAll('input[name="type"]');

const balanceEl = document.getElementById('balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');

const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterMonth = document.getElementById('filter-month');

const transactionList = document.getElementById('transaction-list');
const listNoData = document.getElementById('list-no-data');

const chartCanvas = document.getElementById('category-chart');
const chartNoData = document.getElementById('chart-no-data');
const chartLegend = document.getElementById('chart-legend');

const monthlySummary = document.getElementById('monthly-summary');
const summaryNoData = document.getElementById('summary-no-data');

const toastEl = document.getElementById('toast');

const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Business', 'Other Income'];
const expenseCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Rent', 'Other Expense'];

const CHART_COLORS = [
  '#e84393', '#a855f7', '#6c9cfc', '#f8a170', '#22d3ee',
  '#f472b6', '#7c3aed', '#00c897', '#f97316', '#6366f1',
  '#d946ef', '#ef4444', '#ec4899', '#8b5cf6'
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatCurrency(amount) {
  return '₹' + Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMonthKey(dateStr) {
  return dateStr.substring(0, 7);
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

let toastTimeout = null;
function showToast(message, type = 'info') {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.className = 'toast toast-' + type + ' show';
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function validateForm() {
  clearErrors();
  let valid = true;
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (!amountInput.value || isNaN(amount) || amount <= 0) {
    document.getElementById('amount-error').textContent = 'Please enter a valid positive amount.';
    amountInput.classList.add('input-error');
    valid = false;
  }

  if (!category) {
    document.getElementById('category-error').textContent = 'Please select a category.';
    categorySelect.classList.add('input-error');
    valid = false;
  }

  if (!date) {
    document.getElementById('date-error').textContent = 'Please select a date.';
    dateInput.classList.add('input-error');
    valid = false;
  }

  if (!description) {
    document.getElementById('description-error').textContent = 'Please enter a description.';
    descriptionInput.classList.add('input-error');
    valid = false;
  } else if (description.length > 100) {
    document.getElementById('description-error').textContent = 'Description must be 100 characters or less.';
    descriptionInput.classList.add('input-error');
    valid = false;
  }

  return valid;
}

function updateSummary() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  balanceEl.textContent = (balance < 0 ? '-' : '') + formatCurrency(balance);

  const balanceCard = balanceEl.closest('.card');
  if (balance < 0) {
    balanceEl.style.color = 'var(--clr-expense)';
  } else {
    balanceEl.style.color = 'var(--clr-balance)';
  }
}

function updateFilterCategories() {
  const usedCategories = [...new Set(transactions.map(t => t.category))].sort();
  filterCategory.innerHTML = '<option value="all">All Categories</option>';
  usedCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filterCategory.appendChild(opt);
  });
}

function getFilteredTransactions() {
  let filtered = [...transactions];

  const typeVal = filterType.value;
  if (typeVal !== 'all') {
    filtered = filtered.filter(t => t.type === typeVal);
  }

  const catVal = filterCategory.value;
  if (catVal !== 'all') {
    filtered = filtered.filter(t => t.category === catVal);
  }

  const monthVal = filterMonth.value;
  if (monthVal) {
    filtered = filtered.filter(t => getMonthKey(t.date) === monthVal);
  }

  // Sort by date descending, then by creation time descending
  filtered.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt - a.createdAt;
  });

  return filtered;
}

function renderTransactions() {
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    transactionList.innerHTML = '';
    listNoData.style.display = 'block';
    transactionList.appendChild(listNoData);
    return;
  }

  listNoData.style.display = 'none';
  transactionList.innerHTML = '';

  filtered.forEach(txn => {
    const item = document.createElement('div');
    item.className = `transaction-item ${txn.type}`;
    item.dataset.id = txn.id;

    item.innerHTML = `
      <div class="txn-info">
        <div class="txn-description" title="${escapeHtml(txn.description)}">${escapeHtml(txn.description)}</div>
        <div class="txn-meta">
          <span>📁 ${escapeHtml(txn.category)}</span>
          <span>📅 ${formatDate(txn.date)}</span>
        </div>
      </div>
      <div class="txn-amount ${txn.type}">
        ${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount)}
      </div>
      <div class="txn-actions">
        <button class="edit-btn" title="Edit" onclick="startEdit('${txn.id}')">✏️</button>
        <button class="delete-btn" title="Delete" onclick="deleteTransaction('${txn.id}')">🗑️</button>
      </div>
    `;

    transactionList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const type = document.querySelector('input[name="type"]:checked').value;
  const amount = parseFloat(parseFloat(amountInput.value).toFixed(2));
  const category = categorySelect.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (editingId) {
    const idx = transactions.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      transactions[idx] = { ...transactions[idx], type, amount, category, date, description };
      showToast('Transaction updated successfully!', 'success');
    }
    cancelEdit();
  } else {
    const newTxn = {
      id: generateId(),
      type,
      amount,
      category,
      date,
      description,
      createdAt: Date.now()
    };
    transactions.push(newTxn);
    showToast('Transaction added successfully!', 'success');
  }

  saveToStorage();
  form.reset();
  setDefaultDate();
  typeRadios[0].checked = true;
  refreshAll();
}

function startEdit(id) {
  const txn = transactions.find(t => t.id === id);
  if (!txn) return;

  editingId = id;
  formTitle.textContent = 'Edit Transaction';
  submitBtn.textContent = 'Update Transaction';
  cancelBtn.style.display = 'inline-flex';

  const radio = document.querySelector(`input[name="type"][value="${txn.type}"]`);
  if (radio) radio.checked = true;

  amountInput.value = txn.amount;
  categorySelect.value = txn.category;
  dateInput.value = txn.date;
  descriptionInput.value = txn.description;

  clearErrors();

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  editingId = null;
  formTitle.textContent = 'Add Transaction';
  submitBtn.textContent = 'Add Transaction';
  cancelBtn.style.display = 'none';
  form.reset();
  setDefaultDate();
  typeRadios[0].checked = true;
  clearErrors();
}

function deleteTransaction(id) {
  const txn = transactions.find(t => t.id === id);
  if (!txn) return;

  if (!confirm(`Delete "${txn.description}" (${formatCurrency(txn.amount)})?`)) return;

  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();

  if (editingId === id) cancelEdit();

  showToast('Transaction deleted.', 'error');
  refreshAll();
}

function renderChart() {
  const expenseTxns = transactions.filter(t => t.type === 'expense');

  if (expenseTxns.length === 0) {
    chartCanvas.style.display = 'none';
    chartNoData.style.display = 'block';
    chartLegend.innerHTML = '';
    return;
  }

  chartCanvas.style.display = 'block';
  chartNoData.style.display = 'none';

  const catMap = {};
  expenseTxns.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  const categories = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);
  const values = categories.map(c => catMap[c]);
  const total = values.reduce((s, v) => s + v, 0);

  const ctx = chartCanvas.getContext('2d');
  const size = 260;
  chartCanvas.width = size;
  chartCanvas.height = size;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const innerRadius = 65;

  ctx.clearRect(0, 0, size, size);

  let startAngle = -Math.PI / 2;

  categories.forEach((cat, i) => {
    const sliceAngle = (values[i] / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle = endAngle;
  });

  ctx.fillStyle = '#1d1d1f';
  ctx.font = 'bold 16px Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Total', cx, cy - 12);
  ctx.font = 'bold 18px Segoe UI, system-ui, sans-serif';
  ctx.fillText(formatCurrency(total), cx, cy + 12);

  chartLegend.innerHTML = categories.map((cat, i) => {
    const pct = ((values[i] / total) * 100).toFixed(1);
    return `
      <div class="legend-item">
        <span class="legend-color" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
        ${escapeHtml(cat)} (${pct}%)
      </div>
    `;
  }).join('');
}

function renderMonthlySummary() {
  if (transactions.length === 0) {
    monthlySummary.innerHTML = '';
    summaryNoData.style.display = 'block';
    monthlySummary.appendChild(summaryNoData);
    return;
  }

  summaryNoData.style.display = 'none';

  const monthMap = {};
  transactions.forEach(t => {
    const key = getMonthKey(t.date);
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    monthMap[key][t.type] += t.amount;
  });

  const months = Object.keys(monthMap).sort().reverse();

  monthlySummary.innerHTML = months.map(key => {
    const data = monthMap[key];
    const net = data.income - data.expense;
    const netColor = net >= 0 ? 'var(--clr-income)' : 'var(--clr-expense)';
    return `
      <div class="month-card">
        <h3>${getMonthLabel(key)}</h3>
        <div class="month-row income-row">
          <span class="label">Income</span>
          <span class="value">+${formatCurrency(data.income)}</span>
        </div>
        <div class="month-row expense-row">
          <span class="label">Expenses</span>
          <span class="value">-${formatCurrency(data.expense)}</span>
        </div>
        <div class="month-row net-row">
          <span class="label">Net</span>
          <span class="value" style="color:${netColor}">${net < 0 ? '-' : '+'}${formatCurrency(net)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function refreshAll() {
  updateSummary();
  updateFilterCategories();
  renderTransactions();
  renderChart();
  renderMonthlySummary();
}

function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', cancelEdit);

filterType.addEventListener('change', renderTransactions);
filterCategory.addEventListener('change', renderTransactions);
filterMonth.addEventListener('input', renderTransactions);

setDefaultDate();
refreshAll();
