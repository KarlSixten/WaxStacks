# 📀 WaxStacks

**WaxStacks** is a Node.js CLI tool that connects to the Discogs API (via the `disconnect` library) to help vinyl collectors automatically organize their collections into folders based on the estimated market value of each record.

---

## 🚧 Project Status

**This project is actively in development.**  
The core functionality is coming together, with several key features already implemented and more on the way.

---

## 📦 Features

### ✅ Implemented
- Connect to the Discogs API using a personal user token.
- Prompt for Discogs username, API token, preferred currency, and custom price brackets via an interactive CLI.
- Fetch and display market value data for each release in your collection.
- Automatically create price-based folders in your Discogs collection.
- Move records into appropriate folders based on their current lowest marketplace price.

---

## 🚀 Usage

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/waxstacks.git
cd waxstacks
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Set up your environment variables
Create a `.env` file in the project root and add your Discogs credentials:
```bash
DISCOGS_TOKEN=your_discogs_token_here
DISCOGS_USERNAME=your_discogs_username_here
```

### 4️⃣ Run the app
```bash
node index.js
```
---

### 5️⃣ Follow the CLI prompts
 🔑 Enter your Discogs token and username (if not already set in .env)
 💴 Select your desired currency for marketplace pricing
 💸 Define your custom price brackets (e.g., 10,25,50,100,250)
 📦 Let the app automatically organize your collection into price-based folders

## 📖 Tech Stack

- **Node.js** — JavaScript runtime for building the CLI tool.
- **Discogs API** — for fetching marketplace data and managing your collection.
- [**disconnect**](https://www.npmjs.com/package/disconnect) — official Discogs API wrapper for Node.js.
- [**inquirer**](https://www.npmjs.com/package/inquirer) — for interactive command-line prompts.
- [**dotenv**](https://www.npmjs.com/package/dotenv) — for managing environment variables.
- **native `fetch` (Node 18+)** — for direct HTTP requests to the Discogs marketplace stats endpoint.
- **ES Modules (ESM)** — project uses `import` / `export` syntax.

---