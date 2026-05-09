const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = {
  // Helpers
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Auth
  login: async (name, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    if (!response.ok) throw new Error('Invalid name or password');
    const user = await response.json();
    return user;
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userData.name, password: userData.password, role: userData.role })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
    }
    const user = await response.json();
    return user;
  },

  // Syllabus
  getSyllabi: async () => {
    const user = api.getCurrentUser();
    if (!user) throw new Error('Not authorized');

    const response = await fetch(`${API_BASE_URL}/syllabi/?user_id=${user._id}`);
    if (!response.ok) throw new Error('Failed to fetch syllabi');
    return await response.json();
  },

  getSyllabus: async (id) => {
    const user = api.getCurrentUser();
    const response = await fetch(`${API_BASE_URL}/syllabi/${id}/?user_id=${user ? user._id : ''}`);
    if (!response.ok) throw new Error('Not found');
    return await response.json();
  },

  createSyllabus: async (data) => {
    const user = api.getCurrentUser();
    const payload = { ...data, user_id: user._id };
    
    const response = await fetch(`${API_BASE_URL}/syllabi/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to create syllabus');
    return await response.json();
  },

  updateSyllabus: async (id, data) => {
    const user = api.getCurrentUser();
    const payload = { ...data, user_id: user._id };

    const response = await fetch(`${API_BASE_URL}/syllabi/${id}/?user_id=${user._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to update syllabus');
    return await response.json();
  },

  workflowAction: async (id, action, remarks = '') => {
    const user = api.getCurrentUser();
    const payload = { action, remarks, user_id: user._id };

    const response = await fetch(`${API_BASE_URL}/syllabi/${id}/workflow/?user_id=${user._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update workflow');
    }
    return await response.json();
  },

  downloadPdf: async (id, courseCode) => {
    const syllabus = await api.getSyllabus(id);

    // Load html2pdf dynamically if not present
    if (typeof html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
      await new Promise(r => script.onload = r);
    }

    const htmlContent = `
      <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="images/header.png" alt="SJB Institute of Technology Header" style="width: 100%; max-width: 800px; display: block; margin: 0 auto 10px auto;">
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Course Title</th>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${syllabus.courseTitle}</td>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Course Code</th>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${syllabus.courseCode}</td>
            </tr>
            <tr>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Credits</th>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${syllabus.credits}</td>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">CIE Marks</th>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${syllabus.cieMarks}</td>
            </tr>
            <tr>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Total Marks</th>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${Number(syllabus.cieMarks) + Number(syllabus.seeMarks)}</td>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">SEE Marks</th>
                <td style="border: 1px solid #000; padding: 8px; text-align: left;">${syllabus.seeMarks}</td>
            </tr>
        </table>

        <h2>Module-Wise Syllabus</h2>

        ${(syllabus.modules || []).map((mod, index) => `
            <div style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="margin: 5px 0; font-size: 16px; border-bottom: 1px solid #000;">Module ${index + 1}: ${mod.title} (${mod.teachingHours} Hours)</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr><th style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;" width="20%">Objectives</th><td style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">${mod.objectives || '-'}</td></tr>
                    <tr><th style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">Content</th><td style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">${mod.contentDescription}</td></tr>
                    <tr><th style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">Hands-on</th><td style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">${mod.handsOnExercises || '-'}</td></tr>
                    <tr><th style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">Self-Learning</th><td style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">${mod.selfLearningTopics || '-'}</td></tr>
                    <tr><th style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">RBT Levels</th><td style="border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top;">${mod.rbtLevels || '-'}</td></tr>
                </table>
            </div>
        `).join('')}

        <div class="html2pdf__page-break"></div>

        <h2 style="page-break-before: always;">CO-PO/PSO Mapping</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center;">
            <thead>
                <tr>
                    <th style="border: 1px solid #000; padding: 5px; font-size: 12px;">CO</th>
                    <th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO1</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO2</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO3</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO4</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO5</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO6</th>
                    <th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO7</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO8</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO9</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO10</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO11</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PO12</th>
                    <th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PSO1</th><th style="border: 1px solid #000; padding: 5px; font-size: 12px;">PSO2</th>
                </tr>
            </thead>
            <tbody>
                ${(syllabus.coPoMapping || []).map(map => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.co}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po1 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po2 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po3 || ''}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po4 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po5 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po6 || ''}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po7 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po8 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po9 || ''}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po10 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po11 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.po12 || ''}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.pso1 || ''}</td><td style="border: 1px solid #000; padding: 5px; font-size: 12px;">${map.pso2 || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Syllabus_${courseCode}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(element).set(opt).save();
  }
};
