// Show 'Other' course input if 'Other' is selected
document.addEventListener('DOMContentLoaded', function() {
  const courseSelect = document.getElementById('course');
  const courseOther = document.getElementById('course-other');
  if (courseSelect && courseOther) {
    courseSelect.addEventListener('change', function() {
      if (courseSelect.value === 'Other') {
        courseOther.style.display = 'block';
        courseOther.required = true;
      } else {
        courseOther.style.display = 'none';
        courseOther.required = false;
      }
    });
  }
});

// SPA tabs
const tabLinks = document.querySelectorAll('.tab-link');
const tabs = {
  home: document.getElementById('tab-home'),
  profile: document.getElementById('tab-profile'),
  results: document.getElementById('tab-results'),
  saved: document.getElementById('tab-saved')
};

function activateTab(name) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));
  if (tabs[name]) tabs[name].classList.add('active');
  // Highlight the nav button if it exists
  document.querySelectorAll(`.tab-link[data-tab]`).forEach(btn => {
    if (btn.dataset.tab === name) btn.classList.add('active');
  });
}

// Navigation for all tab-link buttons
document.querySelectorAll('.tab-link').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab) activateTab(tab);
  });
});

// All Get Started buttons (data-go="profile")
document.querySelectorAll('[data-go="profile"]').forEach(btn => {
  btn.addEventListener('click', () => activateTab('profile'));
});

// Dummy data embedded
const SCHOLARSHIPS = [
  {
    id: 'scholarship_A_gpa35',
    type: 'scholarship',
    name: 'Merit Scholars Award',
    amount: 2000,
    min_gpa: 3.2,
    categories: ['STEM','Merit'],
    eligibility: 'GPA >= 3.5; open to all majors with strong academic performance',
    apply_url: 'https://example.org/apply/merit-scholars'
  },
  {
    id: 'scholarship_B_low_income',
    type: 'scholarship',
    name: 'Opportunity Grant',
    amount: 1500,
    min_gpa: 2.5,
    categories: ['Need-based'],
    eligibility: 'Demonstrated financial need; open to undergraduates',
    apply_url: 'https://example.org/apply/opportunity-grant'
  }
];

const LOANS = [
  {
    id: 'loan_A_student_friendly',
    type: 'loan',
    name: 'CampusFlex Student Loan',
    max_amount: 5000,
    interest_rate: 4.2,
    grace_period_months: 6,
    notes: 'Low fees; interest subsidy options for low-income students',
    apply_url: 'https://example.org/apply/campusflex'
  },
  {
    id: 'loan_B_micro',
    type: 'loan',
    name: 'MicroAssist Education Loan',
    max_amount: 1500,
    interest_rate: 3.5,
    grace_period_months: 3,
    notes: 'Good for short-term needs and tuition top-ups',
    apply_url: 'https://example.org/apply/microassist'
  }
];

// Profile handling and recommendations
const profileForm = document.getElementById('profile-form');
const cardsContainer = document.getElementById('cards');
const savedContainer = document.getElementById('saved-cards');
const filterChips = document.querySelectorAll('.chip');

const savedSet = new Set();
let lastRecommendations = [];

function parseCategories(input) {
  return (input || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.toLowerCase());
}

function recommend({ gpa, preference, categories }) {
  const picks = [];
  const cats = parseCategories(categories);

  if (preference === 'both' || preference === 'scholarship') {
    SCHOLARSHIPS.forEach(s => {
      const meetsGpa = typeof s.min_gpa === 'number' ? gpa >= s.min_gpa : true;
      const matchesCat = cats.length === 0 || s.categories.some(c => cats.includes(c.toLowerCase()));
      if (meetsGpa && matchesCat) picks.push(s);
    });
  }

  if (preference === 'both' || preference === 'loan') {
    LOANS.forEach(l => {
      // Simple rule: always show loans; prioritize if low-income mentioned
      const isLowIncome = cats.includes('low-income') || cats.includes('low income');
      const loanScore = isLowIncome ? 2 : 1;
      picks.push({ ...l, loanScore });
    });
  }

  return picks;
}

function renderCards(items) {
  cardsContainer.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    const badgeText = item.type === 'scholarship' ? 'Scholarship' : 'Loan';
    const subtitle = item.type === 'scholarship'
      ? `Amount: $${item.amount.toLocaleString()} • Min GPA: ${item.min_gpa ?? '—'}`
      : `Up to $${item.max_amount.toLocaleString()} • ${item.interest_rate}% APR • ${item.grace_period_months}m grace`;
    div.innerHTML = `
      <span class="badge">${badgeText}</span>
      <strong>${item.name}</strong>
      <span class="muted">${subtitle}</span>
      <div class="card-actions">
        <button class="button" data-action="details">Details</button>
        <button class="button primary" data-action="save">${savedSet.has(item.id) ? 'Saved' : 'Save'}</button>
      </div>
    `;

    div.querySelector('[data-action="details"]').addEventListener('click', () => openModal(item));
    div.querySelector('[data-action="save"]').addEventListener('click', (e) => toggleSave(item, e.target));

    cardsContainer.appendChild(div);
  });
}

function renderSaved() {
  savedContainer.innerHTML = '';
  const all = [...SCHOLARSHIPS, ...LOANS];
  const items = all.filter(x => savedSet.has(x.id));
  if (items.length === 0) {
    savedContainer.innerHTML = '<div class="muted">No saved items yet.</div>';
    return;
    }
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    const badgeText = item.type === 'scholarship' ? 'Scholarship' : 'Loan';
    div.innerHTML = `
      <span class="badge">${badgeText}</span>
      <strong>${item.name}</strong>
      <div class="card-actions">
        <button class="button" data-action="details">Details</button>
        <button class="button" data-action="remove">Remove</button>
      </div>
    `;
    div.querySelector('[data-action="details"]').addEventListener('click', () => openModal(item));
    div.querySelector('[data-action="remove"]').addEventListener('click', () => { savedSet.delete(item.id); renderSaved(); renderCards(lastRecommendations); });
    savedContainer.appendChild(div);
  });
}

// Modal
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalLink = document.getElementById('modal-link');
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function openModal(item) {
  modalTitle.textContent = item.name;
  if (item.type === 'scholarship') {
    modalBody.innerHTML = `
      <div><strong>Amount:</strong> $${item.amount.toLocaleString()}</div>
      <div><strong>Minimum GPA:</strong> ${item.min_gpa ?? '—'}</div>
      <div><strong>Categories:</strong> ${item.categories.join(', ')}</div>
      <div style="margin-top:8px;">${item.eligibility}</div>
    `;
  } else {
    modalBody.innerHTML = `
      <div><strong>Max amount:</strong> $${item.max_amount.toLocaleString()}</div>
      <div><strong>Interest rate:</strong> ${item.interest_rate}% APR</div>
      <div><strong>Grace period:</strong> ${item.grace_period_months} months</div>
      <div style="margin-top:8px;">${item.notes}</div>
    `;
  }
  modalLink.href = item.apply_url;
  modal.classList.remove('hidden');
}
function closeModal() { modal.classList.add('hidden'); }

function toggleSave(item, button) {
  if (savedSet.has(item.id)) {
    savedSet.delete(item.id);
    button.textContent = 'Save';
  } else {
    savedSet.add(item.id);
    button.textContent = 'Saved';
  }
  renderSaved();
}

// Filters
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const v = chip.dataset.filter;
    let items = lastRecommendations;
    if (v === 'scholarship') items = items.filter(i => i.type === 'scholarship');
    if (v === 'loan') items = items.filter(i => i.type === 'loan');
    renderCards(items);
  });
});

// Submit profile
profileForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const gpa = parseFloat(document.getElementById('gpa').value || '0');
  const preference = document.getElementById('preference').value;
  const categories = document.getElementById('categories').value;
  lastRecommendations = recommend({ gpa, preference, categories });
  activateTab('results');
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip[data-filter="both"]').classList.add('active');
  renderCards(lastRecommendations);
});



