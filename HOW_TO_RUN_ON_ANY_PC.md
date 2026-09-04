# 🏥 VitalSync HMS — Kisi Bhi Laptop / PC Par Run Karne Ka Complete Guide

यह गाइड आपको बताएगा कि **VitalSync Hospital Management System** को किसी भी दूसरे लैपटॉप (Windows / Mac / Linux) पर कैसे आसानी से चलाएं।

---

## ⚡ सबसे आसान तरीका (1-Click Run for Windows)

अगर दूसरा व्यक्ति **Windows** इस्तेमाल कर रहा है, तो उसे सिर्फ 1 काम करना है:

1. ZIP फाइल को **Extract (Unzip)** करें।
2. फोल्डर के अंदर मौजूद **`start-windows.bat`** फाइल पर **Double Click** करें!
3. यह स्क्रिप्ट अपने आप:
   - चेक करेगी कि Node.js और Java मौजूद हैं या नहीं।
   - पहली बार में `npm install` अपने आप चला देगी।
   - **Backend (Spring Boot :8080)** और **Frontend (React :5173)** दोनों को शुरू कर देगी।
   - आपके ब्राउज़र में `http://localhost:5173` अपने आप खोल देगी!

---

## 📋 Prerequisites (लैपटॉप में क्या-क्या इनस्टॉल होना चाहिए)

प्रोजेक्ट को चलाने के लिए उस लैपटॉप पर केवल 2 सॉफ्टवेयर होने चाहिए:

1. **Node.js (v18 या नया)**:
   - डाउनलोड लिंक: [https://nodejs.org/](https://nodejs.org/) (LTS Version डाउनलोड और इनस्टॉल करें)
2. **Java JDK 17 (या नया)**:
   - डाउनलोड लिंक: [https://adoptium.net/temurin/releases/?version=17](https://adoptium.net/temurin/releases/?version=17)
   - *Windows Users*: `.msi` इंस्टॉलर डाउनलोड करें और इनस्टॉल करते समय "Set JAVA_HOME variable" को जरूर टिक करें।

---

## 🖥️ Manual Steps (अगर खुद Terminal / CMD से चलाना हो)

अगर आप अलग-अलग Terminal से चलाना चाहते हैं:

### Step 1: Backend शुरू करें (Spring Boot)
1. नया Terminal / CMD खोलें।
2. `backend` फोल्डर में जाएं:
   ```bash
   cd backend
   ```
3. Backend को रन करें:
   - **Windows**: `.\mvnw.cmd spring-boot:run`  (या `run-backend.bat` पर डबल क्लिक करें)
   - **Mac/Linux**: `./mvnw spring-boot:run`
4. Backend `http://localhost:8080` पर स्टार्ट हो जाएगा।
   *(Database: In-Memory H2 DB automatically load ho jata hai)*

---

### Step 2: Frontend शुरू करें (React + Vite)
1. दूसरा नया Terminal / CMD खोलें (Root folder में):
2. Dependencies इनस्टॉल करें (सिर्फ पहली बार):
   ```bash
   npm install
   ```
3. Frontend को रन करें:
   ```bash
   npm run dev
   ```
   *(या `run-frontend.bat` पर डबल क्लिक करें)*
4. Browser में खोलें: `http://localhost:5173`

---

## 🔐 Default Login Credentials (डिफ़ॉल्ट लॉगिन डिटेल्स)

सभी एकाउंट्स का पासवर्ड: **`password123`**

| Role | Username | Password | Full Name | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `password123` | Dr. Sarah Mitchell | Full Administrative Access |
| **DOCTOR** | `dr.chen` | `password123` | Dr. Robert Chen | Attending Cardiologist |
| **DOCTOR** | `dr.stanton` | `password123` | Dr. Emily Stanton | Attending Pediatrician |
| **RECEPTIONIST** | `receptionist` | `password123` | Alex Vance | Front Desk & Invoicing |

---

## 📦 Zip बनाते समय ध्यान रखने योग्य बातें (For You)

जब आप किसी को प्रोजेक्ट ZIP बना कर दे रहे हों:
- **`node_modules`** और **`backend/target`** फोल्डर को ZIP में **मत डालें** (क्योंकि यह बहुत भारी होते हैं और दूसरे सिस्टम में एरर देते हैं)।
- आप सीधे **`create-clean-zip.bat`** पर डबल-क्लिक कर सकते हैं, यह अपने आप सिर्फ 1-2 MB की साफ़-सुथरी **`VitalSync_HMS_Shareable.zip`** बना देगा जिसे आप सीधे किसी को भी भेज सकते हैं!

---

## ❓ Troubleshooting (अक्सर आने वाली समस्याएं और समाधान)

### 1. "Backend connect nahi ho raha / API Error 500 ya Network Error"
- **Local Run**: सिर्फ Frontend चला है, local Backend (`http://localhost:8080`) स्टार्ट नहीं है। `start-windows.bat` या `run-backend.bat` चलाएं।
- **Railway Cloud Deployment**: अगर आपका ऐप Vercel / Cloud पर तैनात है, तो Railway backend URL (`vercel.json` या `VITE_API_URL` env variable) एक्टिव होना चाहिए।

### 2. "'node' is not recognized" या "'java' is not recognized"
- **समाधान**: Node.js और Java JDK 17 इंस्टॉल करें और अपना CMD / VS Code रीस्टार्ट करें।

### 3. Port Already in Use (8080 ya 5173)
- अगर कोई दूसरा ऍप 8080 या 5173 पर चल रहा है, तो उसे बंद करें या टास्क मैनेजर से पुराना java / node प्रोसेस kill करें।

---

## 🚂 Railway Cloud & Railway MySQL Setup Guide

VitalSync HMS का **Backend** और **MySQL Database** को Railway पर डिप्लॉय करना बेहद आसान है:

1. **Railway Marketplace से MySQL add करें**:
   - Railway डैशबोर्ड में `+ New` -> `Database` -> `Add MySQL` पर क्लिक करें।
   - Railway अपने आप `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` एनवायरनमेंट वेरिएबल्स सेट कर देगा।
2. **Spring Boot App Deploy करें**:
   - Repository कनेक्ट करें। Railway ऑटोमैटिकली `railway.json` और root `Dockerfile` के ज़रिये ऐप बिल्ड और रन करेगा।
   - Variables में `SPRING_PROFILES_ACTIVE` = `mysql` सेट करें।
3. **Frontend Rewrites (Vercel)**:
   - `vercel.json` में अपना Railway domain नाम डाल दें या Vercel project Settings में `VITE_API_URL` एनवायरनमेंट वेरिएबल भरें (जैसे: `https://your-app.up.railway.app/api`).

