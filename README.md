# Task Manager

Task Manager is an Expo React Native app for creating projects, attaching tasks to each project, tracking progress, and softly deleting finished or removed projects before they are permanently cleared from Supabase.

## Features

- Create a project with one or more required tasks.
- View project progress based on completed tasks.
- Expand a project card to see active and completed tasks.
- Mark tasks as complete with optimistic UI updates.
- Automatically move a project to the recycle bin when all of its tasks are completed.
- Open the `...` menu on a project card to delete it manually.
- Confirm before deleting a project or completing the final task in a project.
- View recently deleted projects from the recycle-bin button on the home screen.
- Keep deleted projects in local storage and schedule permanent deletion after 3 days.

## Tech Stack

- Expo
- React Native
- Expo Router
- Supabase
- AsyncStorage
- React Native Reanimated

The supabase has been created and using anonymous signin, simply just start the app and test

## Environment Setup

Create a `.env` file in the project root and add these Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlubHdycWt3dnB4cnR5eW9iYm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njc3NDMsImV4cCI6MjA4OTI0Mzc0M30.fgLWwuAAZhCOZXpjl-sY1snn2DJo7H2QJ3ceOjoBruA
EXPO_PUBLIC_SUPABASE_URL=https://inlwrqkwvpxrtyyobbma.supabase.co
```

## Installation

Install dependencies:

```bash
npm install
```

## Run The App

Start the Expo development server:

```bash
npm start
```

You can also run a specific target:

```bash
npm run android
npm run ios
npm run web
```

## How The App Works

### Project creation

- Tap the `+` button on the home screen.
- Enter a project name.
- Add one or more tasks using the task input and add button.
- Tap `Create` to save the project and its tasks.

### Task completion

- Open a project card with the `+` button on the card.
- Tap a task to mark it complete or incomplete.
- If the final remaining task is completed, the app asks for confirmation and then moves the project to the recycle bin.

### Delete flow

- Tap the `...` menu on a card.
- Choose `Delete`.
- Confirm the action in the alert.
- The project is removed from the active list and added to the recycle bin for 3 days.

### Recycle bin

- Tap the recycle-bin button on the home screen header.
- View projects waiting for permanent deletion.
- Projects stay there for 3 days before the app removes them from Supabase.

## Notes

- The app uses optimistic updates so UI changes appear immediately.
- Active project data and deleted-project queue data are stored locally with AsyncStorage.
- Permanent deletion after 3 days is currently client-driven, which means the cleanup runs when the app is opened again or remains active long enough for the scheduled check to run.

## Project Structure

```text
app/
  index.js
  createTask.js
components/
  ProjectCard.js
contexts/
  projectContext.js
lib/
  supabase.js
```
