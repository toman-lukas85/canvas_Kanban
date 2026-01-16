# Changelog

## [1.0.3] - 2026-01-17

### Changed
- **Properties**: Changed `Status` and `Priority` properties from `OptionSet` to `SingleLine.Text` to allow mapping to text-based Dataverse columns.

## [1.0.2] - 2026-01-17

### Added
- **Modern Property Controls**: Converted text inputs to dropdowns (Enums) for:
  - Theme Preset (Light, Dark, Blue, Green)
  - Board Horizontal Alignment
  - Column Alignment
  - Card Vertical Alignment
  - Text Alignment
  - Font Family
- **Optimistic UI**: Implemented local state tracking for drag-and-drop to preventing cards from visually "reverting" before the data refresh.
- **Dataverse Mappings**: Explicit property fields for mapping `Author`, `Email`, `Avatar` to Dataverse columns.

### Fixed
- **Drag and Drop**: Resolved issue where `dataTransfer.setData` was blocked by Power Apps boundaries. Implemented internal singleton state class for reliable drag tracking.
- **Build System**: Fixed issue where `dotnet build` produced empty solution packages.
- **Share Modal**: Adjusted spacing and layout for better visual balance.

### Schema
- Validated compatibility with `lto_kanban_task` Dataverse entity.
