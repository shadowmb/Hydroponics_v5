# Task 26: Restructure Navigation Menu

## Status
- [ ] Implement Sidebar Groups (Accordion)
- [ ] Group Automation Links (Active, Programs, Flows)
- [ ] Verify Hardware Tabs (No changes needed, confirm state)
- [ ] Verify Data & Analytics Link
- [ ] Verify Settings Link
- [ ] Update Routing if needed

## Context
The user requests a reorganization of the main navigation sidebar to group related items under "Automation".

## Requirements
1. **Automation Group:** Contains "Active Program" (Top), "Programs", and "Flows".
2. **Hardware:** Single link (already implemented with tabs).
3. **Data & Analytics:** Single link.
4. **Settings:** Single link.
5. **Dashboard:** Single link.

## Plan
1. Helper: Create `SidebarGroup` component (or inline logic) in `MainLayout`.
2. Update `navItems` structure to support nesting.
3. Render definition in `MainLayout`.
