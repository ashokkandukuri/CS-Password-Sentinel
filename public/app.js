const pw = document.getElementById('password');
const show = document.getElementById('show');
const check = document.getElementById('check');
const bar = document.getElementById('bar');
const strengthTxt = document.getElementById('strength');
const breachTxt = document.getElementById('breach');

show.addEventListener('click', () => {
  pw.type = pw.type === 'password' ? 'text' : 'password';
  show.textContent = pw.type === 'password' ? 'Show' : 'Hide';
});

check.addEventListener('click', async () => {
  const password = pw.value;
  if (!password) return alert('Please enter a password');

  strengthTxt.textContent = 'Checking...';
  breachTxt.textContent = '';

  const res = await fetch('/api/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ password })
  });
  const data = await res.json();

  const { score, label } = data.strength;
  bar.style.width = (score / 5) * 100 + '%';
  strengthTxt.textContent = 'Strength: ' + label;

  if (data.breach.found)
    breachTxt.textContent = `⚠️ Found in ${data.breach.count} breaches!`;
  else
    breachTxt.textContent = '✅ Not found in known breaches.';
});
