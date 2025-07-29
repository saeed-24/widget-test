JotForm.ready(function() {
  // Get elements within the widget container
  const container = this;
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
  generateBtn.addEventListener('click', function() {
    const notes = roughNotes.value.trim();
    
    if (!notes) {
      showStatus('Please enter surveillance notes first', 'error');
      return;
    }
    
    toggleLoading(true);
    showStatus('Generating report...', 'info');
    
    generateReport(notes)
      .then(report => {
        finalReport.value = report;
        saveData();
        showStatus('Report generated successfully!', 'success');
      })
      .catch(error => {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
      })
      .finally(() => {
        toggleLoading(false);
      });
  });

  // Generate report with OpenAI
  async function generateReport(notes) {
    const apiKey = JotForm.widgetParams.get('openai_apiKey');
    
    if (!apiKey) {
      throw new Error('Missing OpenAI API Key. Please configure widget parameters.');
    }

    // Use the correct API endpoint for free ChatGPT
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",  // Use correct model name
        messages: [
          {
            role: "system",
            content: "You are a professional surveillance analyst. Create a formal surveillance report based on these rough notes. Maintain all critical details while improving professionalism, clarity, and structure. Use formal business language. Format with clear sections including: Introduction, Observations, Analysis, and Conclusion."
          },
          {
            role: "user",
            content: `Rough Surveillance Notes:\n${notes}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  // UI Helpers
  function toggleLoading(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.textContent = isLoading ? 'Generating...' : 'Generate Professional Report';
  }

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = type === 'success' ? 'success-msg' : '';
    if (type === 'success') {
      statusMsg.style.color = '#388e3c';
    } else if (type === 'error') {
      statusMsg.style.color = '#d32f2f';
    } else {
      statusMsg.style.color = '#1976d2';
    }
  }
});
