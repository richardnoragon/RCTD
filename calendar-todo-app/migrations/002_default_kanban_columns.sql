-- Add default Kanban columns
INSERT INTO kanban_columns (name, column_order) VALUES
    ('To Do', 0),
    ('In Progress', 1),
    ('Review', 2),
    ('Done', 3);
