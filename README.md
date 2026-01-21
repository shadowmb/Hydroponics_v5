# Ceres - OpenHydro Platform

> **Modern, scalable, and open-source automation for hydroponic environments.**

Ceres is a full-stack IoT platform designed to manage sensors, actuators, and complex environmental logic for hydroponic systems. It bridges the gap between hobbyist tinkering and industrial-grade automation by providing a robust software architecture running on accessible hardware (Raspberry Pi/Node.js).

## 🚀 Key Features

*   **Universal Hardware Abstraction:** Support for various controllers (Arduino, ESP32) and sensors via a unified abstraction layer.
*   **Visual Logic Builder:** Create complex automation rules (Triggers, PID, Timer Loops) without coding.
*   **Real-time Dashboard:** Live monitoring of pH, EC, Temperature, and Humidity with historical trends.
*   **Service-Oriented Architecture:** Built on **Fastify (Node.js)** and **MongoDB** for reliability and speed.
*   **Modern UI:** A beautiful, responsive interface built with **React**, **Vite**, and **Shadcn UI**.

## 🛠️ Technology Stack

*   **Backend:** Node.js, Fastify, Mongoose
*   **Database:** MongoDB
*   **Frontend:** React 18, Tailwind CSS, Radix UI, Recharts
*   **Communication:** Serial/USB, REST API, WebSocket (Socket.io)

## 📦 Getting Started

### Prerequisites
*   Node.js v18+
*   MongoDB v6+

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ceres-openhydro.git
    cd ceres-openhydro
    ```

2.  Install dependencies:
    ```bash
    # Install backend dependencies
    cd backend && npm install

    # Install frontend dependencies
    cd ../frontend && npm install
    ```

3.  Configure Environment:
    *   Copy `backend/.env.example` to `backend/.env`
    *   Update DB credentials and ports if necessary.

4.  Run the System:
    ```bash
    # Start Backend
    cd backend && npm run dev

    # Start Frontend
    cd frontend && npm run dev
    ```

## 🤝 Contributing
Contributions are welcome! Please see `CONTRIBUTING.md` (coming soon) for details.

## 📄 License
MIT License
