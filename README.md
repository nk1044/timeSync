# ⏱️ TimeSync

**TimeSync** is a smart scheduling and task management tool designed to help users efficiently manage their **timetables**, **to-do lists**, and **daily plans**. It combines a clean, mobile-first interface with a powerful backend and a reliable notification service.

[![Flutter](https://img.shields.io/badge/Flutter-%2302569B.svg?style=for-the-badge\&logo=flutter\&logoColor=white)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-%230175C2.svg?style=for-the-badge\&logo=dart\&logoColor=white)](https://dart.dev/)
[![Next JS](https://img.shields.io/badge/Next.js-black?style=for-the-badge\&logo=next.js\&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-%23039BE5.svg?style=for-the-badge\&logo=firebase)](https://firebase.google.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248.svg?style=for-the-badge\&logo=mongodb\&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Riverpod](https://img.shields.io/badge/Riverpod-007ACC?style=for-the-badge\&logo=riverpod\&logoColor=white)](https://riverpod.dev)
[![Zustand](https://img.shields.io/badge/Zustand-000000?style=for-the-badge\&logo=Zustand\&logoColor=white)](https://zustand-demo.pmnd.rs/)
[![Dio](https://img.shields.io/badge/Dio-02569B?style=for-the-badge\&logo=dart\&logoColor=white)](https://pub.dev/packages/dio)

---

## 🌐 Live Website

Visit the official website here:
➡️ [link](https://timesyncer.vercel.app)

---

## 📱 Mobile Application (Flutter)

Built using **Flutter** and **Dart**, the mobile application provides a modern and intuitive interface for:

* Managing daily timetables and event schedules.
* Creating, editing, and organizing to-do lists.
* Setting custom reminders for events and tasks.
* Receiving notifications powered by **Firebase Cloud Messaging**.

### Key Features

* Google Authentication via Firebase
* Advanced state management with Riverpod
* Secure API calls with Dio
* Push notifications for todos and scheduled events

---

## 🧠 Smart Notification Service

A dedicated **Notification Worker Service** runs separately from the main application and backend.

* Implemented in **TypeScript**
* Triggered every 15 minutes using [cron-job.org](https://cron-job.org/)
* Fetches reminders from the database and sends push notifications via Firebase
* Operates independently to ensure timely alerts, even when the user is not actively using the app

---

## 🧩 Backend + Website (Next.js + TypeScript)

The backend and web interface are developed using **Next.js** with TypeScript.

### Features

* RESTful API to manage todos, schedules, and user data
* Google Sign-In integration
* Real-time state management in frontend via **Zustand**
* Data persistence with **MongoDB + Mongoose**
* Optimized server-side rendering for SEO-friendly content

---

## 🗂️ Architecture Overview

```
TimeSync/
├── application/           # Flutter mobile app
│   ├── lib/
│   └── pubspec.yaml
├── backend/               # Next.js backend + website
│   ├── pages/
│   ├── api/
│   └── tsconfig.json
├── notification-worker/   # Cron-based push notification microservice
│   ├── index.ts
│   └── package.json
└── README.md
```

---

## 🧪 Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Mobile App       | Flutter, Dart, Riverpod, Dio            |
| Backend & Web    | Next.js, TypeScript, MongoDB, Mongoose  |
| Authentication   | Firebase Google Auth                    |
| Notifications    | Firebase Cloud Messaging + cron-job.org |
| State Management | Riverpod (Flutter), Zustand (Next.js)   |

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nk1044/timeSync.git
cd timeSync
```

### 2. Set Up Firebase

* Create a Firebase project
* Enable Google Auth and FCM
* Download `google-services.json` for Android
* Download `GoogleService-Info.plist` for iOS
* Set up environment variables and secrets as needed in all three services

### 3. Setup and Run

#### Flutter App

```bash
cd application
flutter pub get
flutter run
```

#### Next.js Backend + Website

```bash
cd backend
npm install
npm run dev
```

#### Notification Worker

```bash
cd notification-worker
npm install
npm start
```

Use [cron-job.org](https://cron-job.org) to ping your worker every 15 minutes with a secret-protected URL.

---

## 🧳 Deployment

* Mobile app can be deployed via APK or through Play Store/TestFlight
* Backend and website are hosted on **Vercel**
* Notification worker can be hosted on **Render**, **Railway**, or any Node-compatible host

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙋‍♂️ Contributing

Pull requests are welcome. Please open an issue first to discuss major changes.

