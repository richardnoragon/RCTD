Okay, here is a consolidated Product Requirements Document (PRD) combining the information from the three provided files. It uses the main PRD structure (`PRD Calander ToDo 1.md`) as the base and integrates details, clarifications, and structural concepts from the database schema (`PRD Calander ToDo DB schema1.md`) and suggestions (`PRD Calander ToDo DB suggestion.md`).

Decisions have been made on several `[Decision Needed]` points based on the provided context (e.g., shared categories, Markdown table as export) to make the document more actionable. Items still requiring project decisions are marked `[Decision Needed]`. Future considerations are clearly delineated.

---

## **Combined Calendar and To-Do Task List Project PRD**

**Version:** 1.0
**Date:** 2023-10-27 (Assumed)

**1. Introduction & Goals**

*   **(To Be Defined):** Briefly state the primary goal of this calendar application. What problem does it solve? Who is the target user? (Example: *To provide power users with a high-performance, offline-first desktop application for managing events, tasks, and notes efficiently.*)
*   **Core Concept:** A high-performance (Rust/Tauri backend) single-user desktop calendar application combining traditional event management with integrated Markdown note-taking, robust To-Do list management (including Kanban view), time tracking, and customization options. Designed with an offline-first approach using a local SQLite database.

**2. Core Features Overview**

*   **Calendar Management:** Multiple views (day, week, month, agenda, annual, custom sorts), event scheduling (single & recurring with exceptions), holiday imports (.ics), categorization.
*   **To-Do List Management:** Task creation/editing/deletion, due dates, priorities, categories, recurring tasks, optional Kanban view with drag-and-drop, dedicated task calendar view.
*   **Integrated Note-Taking:** Create, edit, and attach Markdown notes to events and tasks, with basic permission controls.
*   **Time Management:** Event/task reminders, time tracking (manual, Pomodoro) assignable to events/tasks/categories, utility timers.
*   **Customization:** User-defined categories (shared between events & tasks), event/task coloring/symbols, view preferences, import/export settings.
*   **Participants/Contacts:** Basic contact management for associating participants with events.
*   **Search:** Find events, tasks, and notes based on content.
*   **Data Management:** Import/Export options (ICS feeds, categories, potentially event/task data).

**3. Detailed Feature Requirements**

**3.1. Event Management**

*   **Event Creation & Scheduling:**
    *   Ability to create single, non-repeating events with start/end times or marked as all-day.
    *   Ability to create recurring events with flexible rules (stored via `recurring_rules` structure):
        *   Frequencies: Daily, Weekly, Monthly, Annually.
        *   Intervals: Every X days/weeks/months/years.
        *   Specific Days: On specific days of the week (e.g., every Mon/Wed/Fri).
        *   Monthly Patterns: On the Nth day of the month or the Nth weekday of the month.
        *   Yearly Patterns: On a specific date (e.g., June 5th).
        *   End Conditions: Never, after a specific number of occurrences, or on a specific date.
    *   Ability to define exceptions (modifications or skips) to specific instances of recurring events (stored via `event_exceptions` structure).
    *   Maximum future date limit for scheduling events: 2 years.
*   **Event Ownership & Permissions:**
    *   In the initial single-user context, the concept of "owner" is implicit (the user using the application).
    *   **[Future Consideration]:** If multi-user/sharing is added, define explicit ownership and permissions (e.g., only owner can delete/modify). Display owner initials in shared views.
*   **Event Attributes:**
    *   Title (Required)
    *   Description (Optional)
    *   Start & End Datetime (Required, ISO 8601 format, UTC recommended)
    *   All-Day flag (Boolean)
    *   Location (Optional)
    *   Priority: Integer scale 1 (Highest) to 5 (Lowest), Default 3.
    *   Category: Link to user-defined category (`categories` table).
    *   Participants: Link to contacts (`participants` table).
*   **Participants:**
    *   Ability to associate participants (stored in `participants` table) with events.
    *   Display participant avatars/names within the event details.
    *   See section `3.6. Data Management` for participant import/storage.

**3.2. Calendar Views & Display (Optics)**

*   **Standard Views:**
    *   Daily View
    *   Weekly View (Configurable start day - e.g., Sunday/Monday via `settings`)
    *   Monthly View (Configurable start day)
    *   Agenda View (List of upcoming events and tasks with due dates)
*   **Additional Views:**
    *   Annual View **[Clarify]:** How should this be visualized? (e.g., heat map, simple list?).
    *   Dedicated "Task Calendar" View (See 3.8).
*   **Sorted/Filtered Views (Within Standard Views):**
    *   Ability to sort events/tasks chronologically.
    *   Ability to filter by Category, Priority, Keywords (in title/description), Participants.
    *   **[Decision Needed]:** Define the complexity and UI for combined filtering (e.g., multiple simultaneous filters).
*   **View Configuration:**
    *   Define a default view upon application start (stored in `settings`).
    *   Allow users to save their preferred default view.
*   **Display Conventions:**
    *   All-day events displayed in a distinct section at the top of Daily and Weekly views.
    *   Tasks with due dates should be visually represented in relevant standard calendar views (Daily, Weekly, Monthly, Agenda). This could be a simple entry showing the task title, potentially toggleable.

**3.3. Note-Taking**

*   **Core Functionality:**
    *   Create, edit, view, and delete notes (stored in `notes` table).
    *   Notes can exist independently or be linked to one or more events and/or tasks (Many-to-Many relationship via `event_notes` and `task_notes` linking tables).
    *   Support Markdown for note formatting.
*   **Markdown Support:**
    *   Support CommonMark specification plus GFM Tables and GFM Task Lists (`[ ]`/`[x]`).
    *   **[Future Consideration]:** Code Blocks with syntax highlighting.
    *   Provide a user option to toggle between a WYSIWYG-like editing mode and the raw Markdown source mode.
*   **Permissions (Per Note):**
    *   For initial single-user scope, permissions are less critical but the structure (`permissions` field in `notes` table) should exist.
    *   **[Future Consideration]:** If sharing implemented, allow note creator to set levels: View Only, Editing Allowed.

**3.4. Time Tracking & Reminders**

*   **Reminders:**
    *   Allow setting *one* reminder per event or task (enforced by `UNIQUE` constraint in `reminders` table).
    *   Reminder timing options: Specify minutes, hours, or days before the event start time or task due date. Store trigger datetime (ISO 8601) and offset description (e.g., '15 minutes before').
    *   Provide default reminder settings configurable by the user (stored in `settings`).
    *   Reminders trigger a notification (initially a separate application window). Dismissal status tracked (`is_dismissed` flag).
    *   **[Future Consideration]:** Integrate reminders with system notifications (sound tray, notification center).
*   **Timers:**
    *   Provide utility timers accessible via a separate UI panel/section.
    *   Supported Timer Types (tracked in `time_tracking` table):
        *   Countdown Timer (to a specific duration).
        *   Pomodoro Timer (configurable work/break intervals via `settings`).
        *   Manual Time Tracker (Start/Stop timer).
    *   Manual Time Tracker entries can be associated with:
        *   Specific Events (`item_type='EVENT', item_id=event_id`)
        *   Specific Tasks (`item_type='TASK', item_id=task_id`)
        *   Specific Categories (`item_type='CATEGORY', item_id=category_id`)
        *   No specific item (`item_type='MANUAL', item_id=NULL`)
    *   Pomodoro sessions can optionally be linked to a specific Task being worked on.
    *   Timer alerts (e.g., sound).
    *   **[Future Consideration]:** Integrate timer alerts/status with system notifications/tray.
*   **Time Tracking Reporting:**
    *   Allow viewing time tracked, filterable by date range, category, event, or task (querying `time_tracking` table). Store `duration_seconds` for easier reporting.

**3.5. Visual Customization**

*   **Colors & Symbols:**
    *   Allow users to assign unique colors (hex code) and symbols to Categories (`categories` table). These are used to visually identify associated events and tasks.
    *   Symbol Set:
        *   Initial Set: Predefined basic shapes (circle, triangle, square, pentagon, hexagon, octagon).
        *   **[Future Consideration]:** Support for Emoji or user-uploaded icons.
    *   **Accessibility:** Ensure color is not the *sole* means of conveying critical information (symbols help). Provide sufficient contrast ratios in themes.

**3.6. Data Management**

*   **Categories:**
    *   Allow users to create, edit, and delete custom categories (`categories` table). Categories are shared between Events and Tasks.
    *   Assign colors and symbols (see 3.5).
    *   Used for filtering and visual organization.
    *   Allow export and import of the user's custom category definitions (e.g., JSON or CSV).
*   **Participants/Contacts:**
    *   Store participant information (`participants` table): Name (Required), Email Address (Optional, Unique), Avatar Location (Optional path/URL).
    *   Import participants via: Manual Entry, CSV File Import (Define CSV format).
    *   Allow editing participant profiles, including changing their avatar.
    *   Avatar Source: User Upload stored locally. **[Future Consideration]:** Gravatar lookup based on email.
    *   Scope: Primarily for associating with events, acts as a simple contact list within the app.
*   **Holiday Calendars:**
    *   Support importing standard `.ics` calendar feeds (URLs stored in `holiday_feeds` table).
    *   Allow importing multiple feeds.
    *   Manage imported feeds: Add (by URL), Remove, Toggle visibility (`is_visible` flag), Assign custom name.
    *   Application should fetch and display events from visible feeds dynamically. Consider caching strategies for offline performance.
    *   Store sync status/errors for feeds.
    *   Allow export/import of the feed list and settings.
*   **Exporting Data:**
    *   Obtain user confirmation when exporting potentially sensitive data.
    *   Exportable Items:
        *   Selected Events/Tasks (Format: `.ics`).
        *   Selected Events/Tasks in a specified date range (Format: Markdown Table).
        *   Custom Categories (Format: JSON or CSV).
        *   `.ics` Feed List and Settings (Format: JSON or CSV).
        *   **[Future Consideration]:** Full application data backup (e.g., SQL dump or custom format).
*   **Importing Data:**
    *   Import Events/Tasks from `.ics` files.
    *   Import Categories (from previously exported JSON/CSV).
    *   Import Participants (from CSV).
    *   Import `.ics` Feed List (from previously exported JSON/CSV).

**3.7. Search**

*   Implement robust search functionality:
    *   Search Events: By title, description, location, participant names/emails across all time ranges.
    *   Search Tasks: By title, description.
    *   Search Notes: By content (full-text search capabilities desirable).
    *   Search results should clearly indicate whether the item is an Event, Task, or Note and provide easy navigation to it.

**3.8. To-Do List Management**

*   **Core Task Operations:**
    *   Ability to add new tasks (`tasks` table) with a title (required).
    *   Ability to edit existing task details (title, description, due date, priority, category, status).
    *   Ability to delete tasks.
    *   Ability to mark tasks as completed (sets `status` to 'COMPLETED' and records `completed_at` timestamp). View completed tasks (potentially filtered).
*   **Task Attributes:**
    *   Title (Required)
    *   Description (Optional)
    *   Due Date (Optional, 'YYYY-MM-DD' format).
    *   Priority: Integer scale 1 (Highest) to 5 (Lowest), Default 3.
    *   Status: (e.g., 'PENDING', 'COMPLETED' - potentially derived from Kanban column, see below).
    *   Category: Link to shared user-defined category (`categories` table).
    *   Recurring Rule: Optional link to `recurring_rules` table.
*   **Kanban-Style UI:**
    *   Provide an optional Kanban board view for task management.
    *   Tasks represented as cards.
    *   Organize cards in customizable columns (defined in `kanban_columns` table, with `name` and `column_order`). Default columns: "To Do", "In Progress", "Completed".
    *   Allow users to create/edit/delete/reorder columns.
    *   Allow users to drag and drop task cards between columns. Moving a card to a column like "Completed" should update the task's `status` and `completed_at` fields. Tasks store their `kanban_column_id` and `kanban_order` within that column.
    *   **Kanban Card Enhancements:**
        *   Ability to link Kanban cards to Markdown notes (`task_notes` table).
        *   **[Future Consideration]:** Support for adding tags (separate `tags` and `task_tags` tables).
        *   **[Future Consideration]:** Support for attaching files (requires defining storage mechanism).
        *   **[Future Consideration]:** Visual progress indicators (e.g., based on linked note's checklist completion).
*   **Calendar Integration:**
    *   Provide a dedicated "Task Calendar" view showing tasks plotted on their due dates.
    *   Include tasks with due dates in relevant standard calendar views (see 3.2).
*   **Recurring Tasks:**
    *   Support for creating recurring tasks using the same `recurring_rules` table structure as events.
    *   **[Decision Needed]:** Do recurring tasks need an exception mechanism similar to events (`task_exceptions` table)? Or is modifying the next instance sufficient? (Assume modification is sufficient for MVP unless specified otherwise).
*   **Time Management Integration:**
    *   Allow associating time tracking entries (Manual/Pomodoro) with specific tasks (see 3.4, `time_tracking` table).
*   **Reminders and Notifications:**
    *   Integrate task due dates with the reminder system (`reminders` table) to trigger notifications (see 3.4).
    *   **[Future Consideration]:** Notifications for tasks stalled in certain Kanban columns (e.g., "In Progress" for > X days).
*   **Task Dependencies:**
    *   **[Future Consideration]:** Allow linking tasks to define dependencies (e.g., Task B blocked by Task A). Requires visualization and status handling.

**4. Technical Considerations**

*   **Technology Stack:** Rust backend with Tauri frontend framework.
*   **Data Storage:** SQLite database (`.sqlite` file stored locally).
    *   **Schema:** The database schema should follow the structure outlined previously (and detailed in `Product Requirements Document Calander ToDo DB schema1.md`), including tables like `categories`, `participants`, `recurring_rules`, `events`, `event_exceptions`, `notes`, `event_notes`, `kanban_columns`, `tasks`, `task_notes`, `event_participants`, `reminders`, `time_tracking`, `holiday_feeds`, and `settings`.
    *   **Data Types:** Use appropriate SQLite types (INTEGER, TEXT, REAL). Store dates/datetimes as TEXT in ISO 8601 format (UTC recommended for consistency).
    *   **Relationships:** Use Foreign Keys with appropriate `ON DELETE` / `ON UPDATE` actions (CASCADE for linking tables, SET NULL for optional relationships like categories).
    *   **Indexing:** Implement indexes on foreign keys and frequently queried columns (dates, status, IDs) for performance.
    *   **Timestamps:** Include `created_at` and `updated_at` TEXT columns (ISO 8601) on relevant tables, potentially managed by triggers.
*   **Performance:** Leverage Rust/Tauri and efficient database queries (using indexes) for a responsive UI, even with significant data volume (thousands of events/tasks/notes). Target view render times under TBD ms.
*   **Date/Time Handling:** Use a robust library for handling dates, times, timezones (if applicable later), and recurrence rule calculations. Store dates/times consistently (UTC recommended).

**5. Non-Functional Requirements**

*   **Accessibility:** Adhere to WCAG 2.1 AA guidelines where applicable for desktop applications (color contrast, keyboard navigation, screen reader compatibility).
*   **Performance:** Application startup time < TBD seconds. UI remains responsive during typical operations. Search results return within TBD seconds for a large dataset.
*   **Reliability:** Ensure data integrity through atomic database transactions for write operations. Implement robust saving mechanisms to prevent data loss.
*   **Usability:** Provide an intuitive and efficient user interface.
*   **Maintainability:** Write clean, well-documented code (Rust backend and frontend).
*   **Platform Support:** Initial target: Desktop (Windows, macOS, Linux) via Tauri builds.

**6. Future Considerations (Post-MVP / Potential Enhancements)**

*   Multi-User Support & Collaboration: User accounts, sharing events/tasks/notes, real-time updates.
*   Cloud Synchronization: Sync data across multiple devices via a cloud backend.
*   Advanced Note Features: Rich text editing options, inline images, note version history, advanced commenting.
*   Advanced Kanban Features: Tags, file attachments, WIP limits, swimlanes, progress indicators.
*   Task Dependencies: Blocking relationships between tasks.
*   System Integrations: Native system notifications, tray icons with status/timers.
*   Advanced Reporting: More detailed time tracking reports, productivity analysis.
*   Theming: User-selectable themes (light/dark/custom).
*   Natural Language Processing: Creating events/tasks from natural language input.
*   Contact Integration: Syncing with system contact books (macOS/Windows).
*   Plugin System: Allow third-party extensions.

---

This combined document provides a comprehensive overview of the requirements, informed by both the feature descriptions and the proposed database structure. Remember to continuously refine this document as the project progresses and decisions are finalized.