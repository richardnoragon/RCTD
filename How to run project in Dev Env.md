# How to Run Project in Development Environment

richardnoragon: @workspace  please provide me with a detailed list of how i can run this project in the development enviroment

Workspace: Collecting workspace information# Running the Calendar-Todo App in Development Environment

Based on your workspace, here's a detailed guide to run this Tauri-based calendar and todo application in the development environment:

## Prerequisites

1. Ensure you have Rust installed
   - Check with `rustc --version`
   - If not installed, visit [rustup.rs](https://rustup.rs) to install

2. Make sure Node.js and npm are installed
   - Check with `node --version` and `npm --version`

## Setup Steps

1. Navigate to the project directory:

   ```sh
   cd calendar-todo-app
   ```

2. Install the UI dependencies:

   ```sh
   cd ui
   npm install
   cd ..
   ```

3. Run the database migrations (if not already done):

   ```sh
   # The migrations in the migrations/ folder should run automatically
   # on first start, but you can manually apply them if needed
   ```

## Running the Development Environment

### Method 1: Using Tauri CLI

1. From the project root directory:

   ```sh
   cd calendar-todo-app
   cargo tauri dev
   ```

   This will:
   - Start the frontend dev server (Vite)
   - Build and run the Rust backend
   - Launch the application in development mode

### Method 2: Separate Frontend and Backend

1. Start the frontend development server:

   ```sh
   cd calendar-todo-app/ui
   npm run dev
   ```

2. In another terminal, start the Tauri app:

   ```sh
   cd calendar-todo-app
   cargo tauri dev
   ```

## Testing

To run the tests:

1. Frontend tests:

   ```sh
   cd calendar-todo-app/ui
   npm run test
   ```

2. Accessibility tests:

   ```sh
   cd calendar-todo-app/ui
   npm run test:a11y
   ```

3. Backend (Rust) tests:

   ```sh
   cd calendar-todo-app
   cargo test
   ```

## Building for Production

To build the application for production:

```sh
cd calendar-todo-app
cargo tauri build
```

This will create distributable packages in the `calendar-todo-app/src-tauri/target/release` directory.

## Configuration Files

- Frontend configuration: vite.config.ts
- Tauri configuration: tauri.conf.json
- Rust dependencies: Cargo.toml

The project appears to have completed all core features through Phase 8, with documentation and performance optimization remaining to be implemented.

cd calendar-todo-app
npx tauri dev

PS C:\Users\HP1\Dev\RCTD> npx vite --port 1420

 cd ui && npx vite --port 1420 brings errors