// Initialize widget
JotForm.ready(() => {
  // Create elements reference
  const container = document.querySelector('.surveillance-widget');
  const roughNotes = container.querySelector('#roughNotes');
  const finalReport = container.querySelector('#finalReport');
  const generateBtn = container.querySelector('#generateBtn');
  const statusMsg = container.querySelector('#statusMsg');

  // Load saved data from widget
  const savedData = JotForm.getCustomWidgetData();
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      roughNotes.value = data.notes || '';
      finalReport.value = data.report || '';
    } catch (e) {
      console.error('Error parsing saved data', e);
    }
  }

  // Save data to widget storage
  const saveData = () => {
    const widgetData = JSON.stringify({
      notes: roughNotes.value,
      report: finalReport.value
    });
    JotForm.setCustomWidgetData(widgetData, true);
  };

  // Auto-save when notes change
  roughNotes.addEventListener('input', saveData);

  // Generate report button handler
  generateBtn.addEventListener('click', async () => {
    const notes = roughNotes.value.trim();
    
    if (!notes) {
      showStatus('Please enter surveillance notes first', 'error');
      return;
    }
    
    try {
      toggleLoading(true);
      const report = await generateReport(notes);
      finalReport.value = report;
      saveData();
      showStatus('Report generated successfully!', 'success');
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      toggleLoading(false);
    }
  });

  // Generate report with OpenAI
  async function generateReport(notes) {
    const apiKey = JotForm.widgetParams.get('openai_apiKey');
    
    if (!apiKey) {
      throw new Error('Missing OpenAI API Key. Please configure widget parameters.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional surveillance analyst. Transform the following rough field notes into a formal surveillance report. Maintain all critical details while improving professionalism, clarity, and structure. Use formal business language. Format the report with clear sections."
          },
          {
            role: "user",
            content: `Surveillance Notes:\n${notes}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate report');
    }

    return data.choices[0].message.content.trim();
  }

  // UI Helpers
  function toggleLoading(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.textContent = isLoading ? 'Generating Report...' : 'Generate Professional Report';
  }

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = type === 'success' ? 'success-msg' : '';
  }
});
