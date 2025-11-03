# 🔐 CS Password Sentinel

**CS Password Sentinel** is a full-stack web application that helps users test the **strength and security** of their passwords.  
It checks for **password strength**, **estimated crack times**, and **whether a password appears in known data breaches** (using Have I Been Pwned API).  
The app includes a **modern dark/light theme**, an informative UI, and secure backend logic.

---

## 🚀 Features

- ✅ Real-time password strength analysis using `zxcvbn`
- 🔎 Breach detection via [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- 🔒 Secure password hashing with `PBKDF2`, plus examples of MD5 and SHA-1
- ⚡ Estimated password crack times (GPU, state-actor, etc.)
- 🌗 Light/Dark theme toggle
- 🧠 Educational sections explaining good password practices

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | Node.js, Express.js |
| **Security** | Helmet, Rate Limiting, PBKDF2 |
| **APIs** | Have I Been Pwned (k-anonymity model) |
| **Dependencies** | `axios`, `cors`, `express`, `zxcvbn`, `helmet` |

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/ashokkandukuri/CS-Password-Sentinel.git
cd CS-Password-Sentinel
