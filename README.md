# 🔐 CS Password Sentinel

**CS Password Sentinel** is a full-stack web application that helps users test the **strength and security** of their passwords.  
It analyzes password complexity, estimates crack times, and checks whether a password has appeared in any known **data breaches** using the Have I Been Pwned API.  
This project combines security education with practical password safety checks in a clean, modern UI.

---

## 🚀 Features

- ✅ **Real-time password strength analysis** using `zxcvbn`
- 🔎 **Data breach detection** via [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- 🔒 **Secure password hashing** with PBKDF2, plus demonstrations of insecure methods (MD5, SHA-1)
- ⚡ **Estimated crack time** for multiple attack speeds (Online, GPU, State Actor)
- 🌗 **Light/Dark mode UI** for better usability
- 🧠 **Educational explanations** about password security concepts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript |
| **Backend** | Node.js, Express.js |
| **APIs** | Have I Been Pwned (k-anonymity model) |
| **Security** | Helmet, Rate Limiting, PBKDF2 |
| **Libraries** | `axios`, `cors`, `express`, `zxcvbn`, `helmet` |

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ashokkandukuri/CS-Password-Sentinel.git
cd CS-Password-Sentinel
