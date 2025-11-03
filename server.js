/**
 * server.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto'); // We will use more of this module
const fetch = require('node-fetch');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

let zxcvbn = null;
try {
  zxcvbn = require('zxcvbn');
} catch (e) {
  zxcvbn = null;
  console.warn("zxcvbn package not found. Falling back to simple strength check. Run 'npm install zxcvbn' to enable it.");
}

const app = express();
const PORT = process.env.PORT || 5000;

// --- SECURITY & MIDDLEWARE ---
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/check', apiLimiter);
app.use(express.static('public'));

// ---------------- helpers ----------------

// --- Good Hashing (Modern & Secure) ---
function hashPasswordWithSalt(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// ⭐️ --- NEW: Bad Hashing (Fast & Insecure) --- ⭐️
function hashMD5(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function hashSHA1(password) {
  return crypto.createHash('sha1').update(password).digest('hex');
}
// ⭐️ -------------------------------------------- ⭐️

function sha1Upper(str) {
  return crypto.createHash('sha1').update(str).digest('hex').toUpperCase();
}

async function checkPwned(password) {
  const sha1 = sha1Upper(password);
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const url = `https://api.pwnedpasswords.com/range/${prefix}`;
  try {
    const res = await fetch(url, { headers: { 'Add-Padding': 'true' } });
    if (!res.ok) return { found: false, count: 0 };
    const text = await res.text();
    const lines = text.split('\n');
    for (const line of lines) {
      const [suf, cnt] = line.trim().split(':');
      if (!suf) continue;
      if (suf.toUpperCase() === suffix.toUpperCase()) {
        return { found: true, count: parseInt(cnt.replace(/\r/g, ''), 10) || 0 };
      }
    }
    return { found: false, count: 0 };
  } catch (e) {
    console.error('HIBP error', e);
    return { found: false, count: 0, error: true };
  }
}

function detectCharsetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^A-Za-z0-9]/.test(password)) size += 33;
  if (/\s/.test(password) && !/[^A-Za-z0-9\s]/.test(password)) size += 1;
  return size || 1;
}

function bitsFromCharset(password) {
  const charset = detectCharsetSize(password);
  return password.length * Math.log2(charset);
}

function humanizeSeconds(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return 'less than 1 second';
  const minute = 60, hour = 3600, day = 86400, year = 365 * day;
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < hour) return `${Math.round(seconds / minute)} min`;
  if (seconds < day) return `${Math.round(seconds / hour)} hr`;
  if (seconds < year) return `${Math.round(seconds / day)} days`;
  if (seconds < 1000 * year) return `${(seconds / year).toFixed(1)} years`;
  return 'centuries';
}

function estimateCrackTime(password) {
  const charset = detectCharsetSize(password);
  const length = password.length;
  const lnCharset = Math.log(charset);
  const rates = {
    'Slow online (100/sec)': 100,
    'Fast online (10k/sec)': 1e4,
    'Offline GPU (1M/sec)': 1e6,
    'Cluster GPU (1B/sec)': 1e9,
    'State actor (1T/sec)': 1e12
  };
  const bits = Math.round(bitsFromCharset(password));
  let guessesApprox = null;
  try {
    const maybe = Math.pow(charset, length);
    if (isFinite(maybe) && maybe < Number.MAX_SAFE_INTEGER) guessesApprox = Math.round(maybe);
    else guessesApprox = null;
  } catch (e) { guessesApprox = null; }
  const estimates = {};
  for (const [label, rate] of Object.entries(rates)) {
    const lnSecs = length * lnCharset - Math.log(rate);
    let secs;
    if (lnSecs > 700) secs = Infinity;
    else if (lnSecs < -700) secs = 0;
    else secs = Math.exp(lnSecs);
    estimates[label] = { seconds: secs, human: humanizeSeconds(secs) };
  }
  return { guesses: guessesApprox, bits, estimates };
}

function simpleStrength(password) {
  if (!password || password.length === 0) return { score: 0, label: 'Empty' };
  const len = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasDigit) score++;
  if (hasSymbol) score++;
  score = Math.min(4, Math.max(0, Math.round((score / 5) * 4)));
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score, label: labels[score] || 'Unknown' };
}

// ---------------- routes ----------------

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/check', async (req, res) => {
  try {
    const password = (req.body && req.body.password) ? String(req.body.password) : '';
    let strength = simpleStrength(password);
    let zResult = null;
    if (zxcvbn && password.length > 0) {
      try {
        zResult = zxcvbn(password);
        strength = {
          score: zResult.score,
          label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][zResult.score] || 'Unknown'
        };
      } catch (e) {
        console.warn('zxcvbn failed', e);
      }
    }
    const breach = password.length > 0 ? await checkPwned(password) : { found: false, count: 0 };
    const crack = password.length > 0 ? estimateCrackTime(password) : null;
    const hashing = password.length > 0 ? hashPasswordWithSalt(password) : null;

    // ⭐️ --- NEW HASHING COMPARISON --- ⭐️
    let insecureHashes = null;
    if (password.length > 0) {
      insecureHashes = {
        md5: hashMD5(password),
        sha1: hashSHA1(password)
      };
    }
    // ⭐️ --------------------------------- ⭐️

    // Compose response
    const response = { strength, breach, crack, hashing, insecureHashes }; // <-- Added insecureHashes
    
    if (zResult) {
      response.zxcvbn = {
        guesses: zResult.guesses,
        // ⭐️ --- THIS IS THE FIXED LINE --- ⭐️
        bits: Math.round(zResult.entropy || zResult.guesses_log2 || 0), // Removed the underscore from z_Result
        crack_times_seconds: zResult.crack_times_seconds,
        crack_times_display: zResult.crack_times_display,
        feedback: zResult.feedback
      };
      if (response.crack && response.zxcvbn.bits) {
        response.crack.bits = response.zxcvbn.bits;
      }
    }
    res.json(response);
  } catch (err) {
    console.error('Error in /api/check', err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Password helper server running on http://localhost:${PORT}`);
});