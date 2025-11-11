document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const loginMessage = document.getElementById('loginMessage');

  const dashboardSection = document.getElementById('dashboardSection');
  const filterForm = document.getElementById('filterForm');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const statsTableBody = document.getElementById('statsTableBody');
  const statsSummary = document.getElementById('statsSummary');
  const logoutButton = document.getElementById('logoutButton');

  let adminPassword = null;

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = passwordInput.value.trim();

    if (!password) {
      showLoginMessage('비밀번호를 입력해주세요.', false);
      return;
    }

    toggleLoginForm(false);
    showLoginMessage('로그인 중...', true);

    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        showLoginMessage('로그인에 실패했습니다. 비밀번호를 확인하세요.', false);
        toggleLoginForm(true);
        return;
      }

      const data = await response.json();

      if (data.authenticated) {
        adminPassword = password;
        showLoginMessage('로그인 성공!', true);
        showDashboard();
        await loadStats();
      } else {
        showLoginMessage('로그인에 실패했습니다. 비밀번호를 확인하세요.', false);
        toggleLoginForm(true);
      }
    } catch (error) {
      console.error('login error', error);
      showLoginMessage('로그인 처리 중 오류가 발생했습니다.', false);
      toggleLoginForm(true);
    }
  });

  filterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadStats();
  });

  logoutButton.addEventListener('click', () => {
    adminPassword = null;
    loginForm.reset();
    hideDashboard();
    showLoginMessage('로그아웃되었습니다.', true);
    toggleLoginForm(true);
  });

  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
  }

  function hideDashboard() {
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }

  function toggleLoginForm(enabled) {
    passwordInput.disabled = !enabled;
    loginForm.querySelector('button[type="submit"]').disabled = !enabled;
  }

  function showLoginMessage(message, isSuccess) {
    loginMessage.textContent = message;
    loginMessage.classList.toggle('success', isSuccess);
    loginMessage.classList.toggle('error', !isSuccess);
  }

  async function loadStats() {
    if (!adminPassword) {
      return;
    }

    const params = new URLSearchParams();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';

    try {
      statsSummary.textContent = '데이터를 불러오는 중...';
      statsTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="empty-row">데이터를 불러오는 중...</td>
        </tr>`;

      const response = await fetch(`/admin/stats${query}`, {
        headers: {
          'x-admin-password': adminPassword,
        },
      });

      if (response.status === 401) {
        showLoginMessage('인증이 만료되었습니다. 다시 로그인하세요.', false);
        logoutButton.click();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      renderStats(data.visits ?? []);
    } catch (error) {
      console.error('stats error', error);
      statsSummary.textContent = '데이터를 불러오지 못했습니다.';
      statsTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="empty-row">데이터를 불러오지 못했습니다.</td>
        </tr>`;
    }
  }

  function renderStats(records) {
    if (!records.length) {
      statsSummary.textContent = '조회된 방문 기록이 없습니다.';
      statsTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="empty-row">조회된 방문 기록이 없습니다.</td>
        </tr>`;
      return;
    }

    let total = 0;
    const fragment = document.createDocumentFragment();

    records.forEach((record) => {
      total += record.count ?? 0;
      const row = document.createElement('tr');
      const dateCell = document.createElement('td');
      const countCell = document.createElement('td');
      dateCell.textContent = record.visit_date;
      countCell.textContent = record.count ?? 0;
      row.appendChild(dateCell);
      row.appendChild(countCell);
      fragment.appendChild(row);
    });

    statsTableBody.innerHTML = '';
    statsTableBody.appendChild(fragment);

    const average = total / records.length;
    statsSummary.textContent = `총 ${records.length}일 / 방문자 ${total}명, 하루 평균 ${average.toFixed(1)}명`;
  }
});

