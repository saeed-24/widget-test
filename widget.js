// Get widget container
const container = document.querySelector('.surveillance-widget');

// Create elements
const roughNotes = container.querySelector('#roughNotes');
const finalReport = container.querySelector('#finalReport');
const generateBtn = container.querySelector('#generateBtn');
const statusMsg = container.querySelector('#statusMsg');

// Initialize widget
JotForm.ready(() => {
  // Load saved data
  if (JotForm.getFieldValue('roughNotes')) {
    roughNotes.value = JotForm.getFieldValue('roughNotes');
  }
  if (JotForm.getFieldValue('finalReport')) {
    finalReport.value = JotForm.getFieldValue('finalReport');
  }

  // Save data on change
  roughNotes.addEventListener('input', () => {
    JotForm.setFieldValue('roughNotes', roughNotes.value);
  });

  // Generate report button handler
  generateBtn.addEventListener('click', async () => {
    if (!roughNotes.value.trim()) {
      showStatus('Please enter surveillance notes first', 'error');
      return;
    }
    
    try {
      toggleLoading(true);
      const report = await generateReport(roughNotes.value);
      finalReport.value = report;
      JotForm.setFieldValue('finalReport', report);
      showStatus('Report generated successfully!', 'success');
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      toggleLoading(false);
    }
  });
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
      messages: [{
        role: "system",
        content: "You are a professional surveillance analyst. Transform rough field notes into a formal surveillance report. Maintain all critical details while improving professionalism, clarity, and structure. Use formal business language."
      }, {
        role: "user",
        content: `Transform these surveillance notes into a professional report:\n\n${notes}`
      }],
      temperature: 0.3,
      max_tokens: 1000
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
  generateBtn.textContent = isLoading ? 'Generating...' : 'Generate Professional Report';
}

function showStatus(message, type) {
  statusMsg.textContent = message;
  statusMsg.className = type;
}