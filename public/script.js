document.addEventListener('DOMContentLoaded', () => {

  // --- ⭐️ New Theme Switcher Logic ⭐️ ---
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme');

  // Apply the saved theme on load
  if (currentTheme) {
    document.body.classList.add(currentTheme);
    if (currentTheme === 'dark-theme') {
      themeToggle.checked = true;
    }
  }

  // Listen for toggle click
  themeToggle.addEventListener('change', () => {
    let theme = 'light-theme'; // Default
    if (themeToggle.checked) {
      theme = 'dark-theme';
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
    // Save the preference
    localStorage.setItem('theme', theme);
  });
  // --- ⭐️ End of Theme Logic ⭐️ ---


  // Get all the UI elements from index.html
  const passwordInput = document.getElementById('password');
  const checkBtn = document.getElementById('checkBtn');
  const strengthFill = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');
  const bitsLabel = document.getElementById('bitsLabel');
  const breachSection = document.getElementById('breachSection');
  const breachResult = document.getElementById('breachResult');
  const crackSection = document.getElementById('crackSection');
  const crackList = document.getElementById('crackList');
  const rawJson = document.getElementById('rawJson');
  const feedbackSection = document.getElementById('feedbackSection');
  const feedbackWarning = document.getElementById('feedbackWarning');
  const feedbackSuggestions = document.getElementById('feedbackSuggestions');
  const hashSection = document.getElementById('hashSection');
  const hashSalt = document.getElementById('hashSalt');
  const hashResult = document.getElementById('hashResult');
  let debounceTimer;
  // ... after const hashResult = ...
  const hashCompareSection = document.getElementById('hashCompareSection');
  const hashMd5 = document.getElementById('hashMd5');
  const hashSha1 = document.getElementById('hashSha1');
  const hashPbkdf2 = document.getElementById('hashPbkdf2');

  // This function sends the password to our server
  const checkPassword = async () => {
    const password = passwordInput.value;

    if (!password) {
      // Reset UI if password is empty
      resetUI();
      return;
    }

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await res.json();
      updateUI(data);

    } catch (err) {
      console.error('Error fetching password check:', err);
      strengthLabel.textContent = 'Error checking. Is the server running?';
      rawJson.textContent = `Error: ${err.message}`;
    }
    // ... after the Hashing Section block ...

  // 8. Update Hashing Comparison Section
  if (data.insecureHashes && data.hashing) {
    hashMd5.textContent = data.insecureHashes.md5;
    hashSha1.textContent = data.insecureHashes.sha1;
    // We re-use the secure hash from the other section
    hashPbkdf2.textContent = data.hashing.hash; 
    hashCompareSection.style.display = 'block';
  } else {
    hashCompareSection.style.display = 'none';
  }
  };

  // This function updates all the HTML elements with the new data
  const updateUI = (data) => {
    // 1. Update Strength Bar (zxcvbn score is 0-4)
    const strengthPercent = (data.strength.score / 4) * 100;
    strengthFill.style.width = `${strengthPercent}%`;
    // Set data-score to change color via CSS
    strengthFill.dataset.score = data.strength.score;
    strengthLabel.textContent = data.strength.label || 'N/A';

    // 2. Update Bits
    bitsLabel.textContent = (data.crack && data.crack.bits) ? `${data.crack.bits} bits` : '';

    // 3. Update Breach Info
    breachSection.style.display = 'block';
    if (data.breach.found) {
      breachResult.textContent = `⚠️ Found in ${data.breach.count.toLocaleString()} known data breaches!`;
      breachResult.className = 'small warn'; // Add 'warn' class
    } else {
      breachResult.textContent = '✅ Not found in any known breaches.';
      breachResult.className = 'small'; // Remove 'warn' class
    }

    // 4. Update Crack Times
    crackSection.style.display = 'block';
    // ... after the Feedback section block ...

  // 7. Update Hashing Section
  if (data.hashing && data.hashing.salt && data.hashing.hash) {
    hashSalt.textContent = data.hashing.salt;
    hashResult.textContent = data.hashing.hash;
    hashSection.style.display = 'block';
  } else {
    hashSection.style.display = 'none';
  }
    if (data.crack && data.crack.estimates) {
      crackList.innerHTML = Object.entries(data.crack.estimates)
        .map(([label, time]) => `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>${label}:</span>
            <span style="font-weight:600;">${time.human}</span>
          </div>
        `)
        .join('');
    }

    // ... after the crack times "if" block ...

// 6. Update Feedback Section
if (data.zxcvbn && data.zxcvbn.feedback) {
  const { warning, suggestions } = data.zxcvbn.feedback;
  
  if (warning) {
    feedbackWarning.textContent = `⚠️ ${warning}`;
    feedbackWarning.style.display = 'block';
  } else {
    feedbackWarning.style.display = 'none';
  }
  
  if (suggestions && suggestions.length > 0) {
    feedbackSuggestions.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
    feedbackSuggestions.style.display = 'block';
  } else {
    feedbackSuggestions.style.display = 'none';
  }
  
  if (warning || (suggestions && suggestions.length > 0)) {
    feedbackSection.style.display = 'block';
  } else {
    feedbackSection.style.display = 'none';
  }
  
} else {
  feedbackSection.style.display = 'none';
}

    // 5. Update Raw JSON
    rawJson.textContent = JSON.stringify(data, null, 2);
  };

  // This function resets the UI when the input is empty
  const resetUI = () => {
    strengthFill.style.width = '0%';
    strengthFill.dataset.score = "0";
    strengthLabel.textContent = 'N/A';
    bitsLabel.textContent = '';
    breachSection.style.display = 'none';
    breachResult.textContent = '—';
    crackSection.style.display = 'none';
    crackList.innerHTML = '';
    rawJson.textContent = '—';
    // ... inside resetUI() ...
   feedbackSection.style.display = 'none';
   feedbackWarning.textContent = '';
   feedbackSuggestions.innerHTML = '';
   // ... inside resetUI() ...
   hashSection.style.display = 'none';
   hashSalt.textContent = '';
   hashResult.textContent = '';
  };
  // ... inside resetUI() ...
  hashCompareSection.style.display = 'none';
  hashMd5.textContent = '';
  hashSha1.textContent = '';
  hashPbkdf2.textContent = '';

  // --- Event Listeners ---
  checkBtn.addEventListener('click', checkPassword);
  passwordInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      checkPassword();
    }, 300);
  });

  // Reset UI on load
  resetUI();
});