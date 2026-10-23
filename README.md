# Linux Fleet Manager

A web-based system to monitor Linux servers, track system health, visualize resource metrics, and manage approved remote commands from a centralized dashboard.

## Features

- **Authentication:** JWT-based login.
- **Role-Based Access Control:** Separate admin and user roles.
- **Node Health Monitoring:** Heartbeat checks to identify unreachable nodes.
- **Command Execution:** Controlled execution of approved Linux commands.
- **Command Allowlisting:** Restricts execution to explicitly permitted commands.
- **Audit Logging:** Records command execution activity.
- **System Metrics:** Collects Linux server metrics using Prometheus and Node Exporter.
- **Visualization:** Grafana dashboards for monitoring server performance.
- **Web Dashboard:** React-based frontend for interacting with the system.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Monitoring | Prometheus, Node Exporter |
| Visualization | Grafana |
| Server Environment | Linux, AWS EC2 |

## Project Structure

```text
linux-fleet-manager/
├── frontend/              # React dashboard
├── src/
│   ├── middleware/        # Authentication and authorization
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Heartbeat monitoring
│   ├── utils/             # Command allowlist
│   └── server.js          # Express server
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB
- Prometheus and Node Exporter (for metrics monitoring)
- Grafana (for metric visualization)

### 1. Clone the Repository

```bash
git clone https://github.com/harshada-dhole89/linux-fleet-manager.git
cd linux-fleet-manager
```

### 2. Install Backend Dependencies

```bash
npm install
```



### 3. Configure Environment Variables

Create a `.env` file in the project root directory.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: A strong, randomly generated secret used to sign JWTs.

Never commit your `.env` file or share real credentials. Keep secrets out of GitHub.





### 4. Start the Backend

From the project root directory, run:

```bash
npm start
```

The backend listens on port `4000`.

Check the health endpoint:

```text
http://localhost:4000/health
```


### 5. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Monitoring Architecture

1. Node Exporter exposes Linux system metrics.
2. Prometheus periodically scrapes and stores those metrics.
3. Grafana queries Prometheus and visualizes the collected data.
4. The Fleet Manager backend monitors node health and exposes API endpoints for the dashboard.

## Security

- Authentication is handled using JWTs.
- Protected endpoints use authentication and role-based authorization.
- Remote command execution is restricted through an allowlist.
- Database credentials and secrets should be supplied through environment variables.
- Production deployments should use secure SSH access and appropriate network restrictions.

## Future Improvements

- Add more detailed node health and performance views.
- Improve command execution history and audit reporting.
- Add alerts for resource usage thresholds.
- Support management of multiple Linux servers from one dashboard.
- Improve deployment and monitoring automation.

## Author

**Harshada Dhole**

B.Tech — Computer Science and Engineering (IoT)
GitHub: [harshada-dhole89](https://github.com/harshada-dhole89)