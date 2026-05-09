document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  const path = window.location.pathname;
  const isLoginPage = path.endsWith('index.html') || path === '/';
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user && !isLoginPage) {
    window.location.href = 'index.html';
  } else if (user && isLoginPage) {
    window.location.href = 'dashboard.html';
  }

  // Set up navbar
  if (!isLoginPage && user) {
    const navbar = `
      <nav class="navbar">
        <div class="brand">Autonomous Syllabus System</div>
        <div class="navbar-actions">
          <span>Welcome, <strong>${user.name}</strong> (${user.role})</span>
          ${user.role === 'Faculty' ? '<a href="faculty_form.html" class="btn btn-primary" style="padding: 0.5rem 1rem;">New Syllabus</a>' : ''}
          <a href="dashboard.html" class="btn btn-outline" style="padding: 0.5rem 1rem;">Dashboard</a>
          <button id="logoutBtn" class="btn btn-outline" style="padding: 0.5rem 1rem;">Logout</button>
        </div>
      </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', navbar);

    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    });
  }
});

// Helper functions for UI
function getStatusBadge(status) {
  const map = {
    'Draft': 'badge-draft',
    'Pending_BOS': 'badge-pending',
    'Pending_HOD': 'badge-pending',
    'Approved': 'badge-approved',
    'Rejected': 'badge-rejected'
  };
  const labelMap = {
    'Draft': 'Draft',
    'Pending_BOS': 'Pending BOS',
    'Pending_HOD': 'Pending HOD',
    'Approved': 'Approved',
    'Rejected': 'Rejected'
  };
  return `<span class="badge ${map[status]}">${labelMap[status]}</span>`;
}
