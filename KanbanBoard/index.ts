import { IInputs, IOutputs } from "./generated/ManifestTypes";

// Data types
interface Task {
    id: string;
    title: string;
    status: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
    description?: string;
    recordId?: string;
    // Author/assignee information
    authorFirstName?: string;
    authorLastName?: string;
    authorEmail?: string;
    authorAvatar?: string;
    isOptimistic?: boolean;
}

interface ColumnDefinition {
    id: string;
    title: string;
    statusValues: string[];
    color?: string;
}

interface Column {
    id: string;
    title: string;
    taskIds: string[];
    statusValues: string[];
    color?: string;
}

interface BoardData {
    tasks: Record<string, Task>;
    columns: Record<string, Column>;
    columnOrder: string[];
}

interface AlignmentConfig {
    boardHorizontal: string;
    columnsHorizontal: string;
    cardsVertical: string;
    text: string;
}

export class KanbanBoard implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _notifyOutputChanged: () => void;

    // Internal state
    private _boardData: BoardData;
    private _draggedElement: HTMLElement | null = null;
    private _draggedTaskId: string | null = null;
    private _sourceColumnId: string | null = null;
    private _lastUpdatedTask: string | null = null;
    private _pendingUpdate = false;
    private _columnDefinitions: ColumnDefinition[] = [];

    // Style and alignment configuration
    private _styleConfig = {
        fontFamily: 'Segoe UI',
        fontSize: 14,
        primaryColor: '#3b82f6',
        backgroundColor: '#faf9f8',
        columnBackgroundColor: '#f5f7fa',
        cardBackgroundColor: '#ffffff',
        textColor: '#1f2937',
        secondaryTextColor: '#6b7280',
        highPriorityColor: '#dc2626',
        mediumPriorityColor: '#ea580c',
        lowPriorityColor: '#059669'
    };

    // Border radius configuration
    private _radiusConfig = {
        board: 8,
        column: 12,
        card: 8,
        badge: 12
    };

    // Shadow configuration
    private _shadowConfig = {
        board: 'Medium',
        column: 'Subtle',
        card: 'Medium',
        cardHover: 'Strong',
        customBoard: '',
        customColumn: '',
        customCard: '',
        customCardHover: ''
    };

    // Hover effects configuration
    private _hoverConfig = {
        enabled: true,
        transitionDuration: 200,
        cardScale: 1.02,
        cardElevation: 4
    };

    private _alignmentConfig: AlignmentConfig = {
        boardHorizontal: 'Left',
        columnsHorizontal: 'Left',
        cardsVertical: 'Top',
        text: 'Left'
    };

    // Text configuration for multiline support
    private _textConfig = {
        enableMultiline: true,
        maxLines: 3,
        lineHeight: 1.5,
        wordWrap: true,
        textOverflow: 'ellipsis', // 'ellipsis', 'clip', 'fade'
        showTooltipOnOverflow: true,
        fontFamily: 'Segoe UI'
    };

    private _layoutConfig = {
        columnWidth: 300,
        columnMinWidth: 250,
        columnMaxWidth: 500,
        columnSpacing: 16,
        cardSpacing: 8
    };

    // Author display configuration
    private _authorConfig = {
        showBadge: true,
        displayFormat: 'Full Name',
        position: 'Top Right',
        customFormat: '',
        showAvatar: true,
        avatarSize: 24,
        badgeColor: '#e0e7ff',
        // Field mappings
        firstNameField: 'authorFirstName',
        lastNameField: 'authorLastName',
        emailField: 'authorEmail',
        avatarField: 'authorAvatar'
    };

    // New property for Priority Badge
    private _showPriorityBadge = true;
    private _shareModalConfig = {
        overlayColor: 'rgba(0, 0, 0, 0.3)',
        overlayOpacity: 0.3,
        borderRadius: 8, // Will be prioritized from _radiusConfig.card if not set
        shadow: 'Medium',
        fontFamily: 'Segoe UI',
        fontSize: 14,
        textColor: '#1f2937',
        headerColor: '#111827',
        backgroundColor: '#ffffff',
        padding: 20,
        textAlignment: 'Left'
    };

    constructor() {
        this._boardData = this.getEmptyBoardData();
    }

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
        this._context = context;
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;

        // Update configurations
        this.updateColumnDefinitions();
        this.updateStyleConfiguration();
        this.updateAlignmentConfiguration();
        this.updateLayoutConfiguration();
        this.updateAuthorConfiguration();
        this.updateRadiusAndShadowConfiguration();

        // Load data
        this.loadData();
        this.renderBoard();

        // Global listener to close popups when clicking outside
        document.addEventListener('click', (e) => {
            const popups = this._container.querySelectorAll('.share-popup');
            popups.forEach((popup) => {
                (popup as HTMLElement).style.display = 'none';
            });
        });
    }



    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;

        // Update all configurations
        this.updateColumnDefinitions();
        this.updateStyleConfiguration();
        this.updateAlignmentConfiguration();
        this.updateLayoutConfiguration();
        this.updateAuthorConfiguration();
        this.updateRadiusAndShadowConfiguration();

        // Check if dataset has changed - use fallback for now
        // Always reload data and render to support all sources and fallbacks
        this.loadData();
        this.renderBoard();
    }

    private updateColumnDefinitions(): void {
        // Use simple configuration for now since advanced properties aren't available yet
        this._columnDefinitions = this.getDefaultColumnDefinitions();
    }

    private parseQuickColumnSetup(setup: string): ColumnDefinition[] {
        const statuses: string[] = [];

        if (setup.startsWith('[') && setup.endsWith(']')) {
            statuses.push(...setup.slice(1, -1).split(',').map(s => s.trim()));
        } else if (setup.includes('|')) {
            statuses.push(...setup.split('|').map(s => s.trim()));
        } else {
            statuses.push(...setup.split(',').map(s => s.trim()));
        }

        return statuses.filter(s => s.length > 0).map((status, index) => ({
            id: `col_${index}`,
            title: status,
            statusValues: [status]
        }));
    }

    private getDefaultColumnDefinitions(): ColumnDefinition[] {
        return [
            { id: 'todo', title: 'To Do', statusValues: ['Todo', 'New', 'Open'] },
            { id: 'inprogress', title: 'In Progress', statusValues: ['In Progress', 'Active', 'Working'] },
            { id: 'review', title: 'Review', statusValues: ['Review', 'Testing', 'Validation'] },
            { id: 'done', title: 'Done', statusValues: ['Done', 'Completed', 'Closed'] }
        ];
    }

    private updateStyleConfiguration(): void {
        const theme = this._context.parameters.themePreset?.raw || 'Light';

        switch (theme) {
            case 'Dark':
                this._styleConfig.backgroundColor = '#1f2937'; // Gray 800
                this._styleConfig.columnBackgroundColor = '#374151'; // Gray 700
                this._styleConfig.cardBackgroundColor = '#111827'; // Gray 900
                this._styleConfig.textColor = '#f9fafb'; // Gray 50
                this._styleConfig.secondaryTextColor = '#9ca3af'; // Gray 400
                this._styleConfig.primaryColor = '#60a5fa'; // Blue 400
                break;
            case 'Blue':
                this._styleConfig.primaryColor = '#2563eb'; // Blue 600
                this._styleConfig.backgroundColor = '#eff6ff'; // Blue 50
                this._styleConfig.columnBackgroundColor = '#dbeafe'; // Blue 100
                this._styleConfig.cardBackgroundColor = '#ffffff';
                this._styleConfig.textColor = '#1e3a8a'; // Blue 900
                this._styleConfig.secondaryTextColor = '#6b7280';
                break;
            case 'Green':
                this._styleConfig.primaryColor = '#059669'; // Emerald 600
                this._styleConfig.backgroundColor = '#ecfdf5'; // Emerald 50
                this._styleConfig.columnBackgroundColor = '#d1fae5'; // Emerald 100
                this._styleConfig.cardBackgroundColor = '#ffffff';
                this._styleConfig.textColor = '#064e3b'; // Emerald 900
                this._styleConfig.secondaryTextColor = '#6b7280';
                break;
            case 'Light':
            default:
                // Standard Light Theme defaults
                this._styleConfig.backgroundColor = '#faf9f8';
                this._styleConfig.columnBackgroundColor = '#f5f7fa';
                this._styleConfig.cardBackgroundColor = '#ffffff';
                this._styleConfig.textColor = '#1f2937';
                this._styleConfig.secondaryTextColor = '#6b7280';
                this._styleConfig.primaryColor = '#3b82f6';
                break;
        }

        // Allow manual overrides if provided (Hex codes still work)
        if (this._context.parameters.primaryColor?.raw) this._styleConfig.primaryColor = this._context.parameters.primaryColor.raw;
        if (this._context.parameters.backgroundColor?.raw) this._styleConfig.backgroundColor = this._context.parameters.backgroundColor.raw;
        if (this._context.parameters.columnBackgroundColor?.raw) this._styleConfig.columnBackgroundColor = this._context.parameters.columnBackgroundColor.raw;
        if (this._context.parameters.cardBackgroundColor?.raw) this._styleConfig.cardBackgroundColor = this._context.parameters.cardBackgroundColor.raw;
        if (this._context.parameters.textColor?.raw) this._styleConfig.textColor = this._context.parameters.textColor.raw;

        if (this._context.parameters.boardHeight?.raw) {
            // Handled by CSS container, logical height
        }
        if (this._context.parameters.columnWidth?.raw) {
            this._layoutConfig.columnWidth = this._context.parameters.columnWidth.raw;
        }
    }

    private updateAlignmentConfiguration(): void {
        // Now we can use the actual parameters since they're available in the manifest
        if (this._context.parameters.textAlignment?.raw) {
            this._alignmentConfig.text = this._context.parameters.textAlignment.raw;
        }

        // Update multiline configuration with actual parameters
        this._textConfig.enableMultiline = this._context.parameters.enableMultilineText?.raw !== false;
        this._textConfig.maxLines = this._context.parameters.maxTextLines?.raw || 3;
        this._textConfig.lineHeight = this._context.parameters.textLineHeight?.raw || 1.5;
        this._textConfig.wordWrap = this._context.parameters.enableWordWrap?.raw !== false;
        this._textConfig.showTooltipOnOverflow = this._context.parameters.showTextTooltip?.raw !== false;

        // Update alignment settings
        if (this._context.parameters.boardHorizontalAlignment?.raw) {
            this._alignmentConfig.boardHorizontal = this._context.parameters.boardHorizontalAlignment.raw;
        }
        if (this._context.parameters.columnsHorizontalAlignment?.raw) {
            this._alignmentConfig.columnsHorizontal = this._context.parameters.columnsHorizontalAlignment.raw;
        }
        if (this._context.parameters.cardsVerticalAlignment?.raw) {
            this._alignmentConfig.cardsVertical = this._context.parameters.cardsVerticalAlignment.raw;
        }
    }

    private updateLayoutConfiguration(): void {
        if (this._context.parameters.columnWidth?.raw && this._context.parameters.columnWidth.raw > 0) {
            this._layoutConfig.columnWidth = this._context.parameters.columnWidth.raw;
        }

        // Ensure defaults for spacing to prevent NaN
        this._layoutConfig.columnSpacing = this._context.parameters.columnSpacing?.raw || 16;
        this._layoutConfig.cardSpacing = this._context.parameters.cardSpacing?.raw || 10;

        // Map advanced min/max width if available
        if (this._context.parameters.columnMinWidth?.raw) {
            this._layoutConfig.columnMinWidth = this._context.parameters.columnMinWidth.raw;
        }
        if (this._context.parameters.columnMaxWidth?.raw) {
            this._layoutConfig.columnMaxWidth = this._context.parameters.columnMaxWidth.raw;
        }
    }

    private updateAuthorConfiguration(): void {
        // Temporarily using basic configuration since new properties are not yet in generated types
        // After manifest regeneration, these will be available:
        // if (this._context.parameters.showAuthorBadge?.raw !== undefined) {
        //     this._authorConfig.showBadge = this._context.parameters.showAuthorBadge.raw;
        // }

        // Using fixed settings for demo:
        this._authorConfig.showBadge = true;
        this._authorConfig.showAvatar = true;
        this._authorConfig.displayFormat = 'Full Name';
        this._authorConfig.position = 'Top Right';
        this._authorConfig.avatarSize = 20;
        this._authorConfig.badgeColor = '#e0e7ff';

        // this._authorConfig.avatarSize = this._context.parameters.authorAvatarSize?.raw || 20;
        // this._authorConfig.badgeColor = this._context.parameters.authorBadgeColor?.raw || '#e0e7ff';

        // Update Priority Badge setting
        if (this._context.parameters.showPriorityBadge?.raw !== undefined) {
            this._showPriorityBadge = this._context.parameters.showPriorityBadge.raw;
        }

        // Update Share Modal setting
        if (this._context.parameters.shareModalOverlayColor?.raw) {
            this._shareModalConfig.overlayColor = this._context.parameters.shareModalOverlayColor.raw;
        }
        if (this._context.parameters.shareModalOverlayOpacity?.raw !== undefined && this._context.parameters.shareModalOverlayOpacity.raw !== null) {
            this._shareModalConfig.overlayOpacity = this._context.parameters.shareModalOverlayOpacity.raw;
        }
        if (this._context.parameters.shareModalBorderRadius?.raw !== undefined && this._context.parameters.shareModalBorderRadius.raw !== null) {
            this._shareModalConfig.borderRadius = this._context.parameters.shareModalBorderRadius.raw;
        }
        if (this._context.parameters.shareModalShadow?.raw) {
            this._shareModalConfig.shadow = this._context.parameters.shareModalShadow.raw;
        }
        if (this._context.parameters.fontFamily?.raw) {
            this._textConfig.fontFamily = this._context.parameters.fontFamily.raw;
        }
        if (this._context.parameters.shareModalFontSize?.raw !== undefined && this._context.parameters.shareModalFontSize.raw !== null) {
            this._shareModalConfig.fontSize = this._context.parameters.shareModalFontSize.raw;
        }
        if (this._context.parameters.shareModalTextColor?.raw) {
            this._shareModalConfig.textColor = this._context.parameters.shareModalTextColor.raw;
        }
        if (this._context.parameters.shareModalHeaderColor?.raw) {
            this._shareModalConfig.headerColor = this._context.parameters.shareModalHeaderColor.raw;
        }
        if (this._context.parameters.shareModalBackgroundColor?.raw) {
            this._shareModalConfig.backgroundColor = this._context.parameters.shareModalBackgroundColor.raw;
        }
        if (this._context.parameters.shareModalPadding?.raw !== undefined && this._context.parameters.shareModalPadding.raw !== null) {
            this._shareModalConfig.padding = this._context.parameters.shareModalPadding.raw;
        }
        if (this._context.parameters.shareModalTextAlignment?.raw) {
            this._shareModalConfig.textAlignment = this._context.parameters.shareModalTextAlignment.raw;
        }
    }

    private updateRadiusAndShadowConfiguration(): void {
        // Demo settings for showcase (after manifest regeneration will be configurable):
        this._radiusConfig = {
            board: 12,
            column: 16,
            card: 10,
            badge: 20
        };

        this._shadowConfig = {
            board: 'Medium',
            column: 'Subtle',
            card: 'Medium',
            cardHover: 'Strong',
            customBoard: '',
            customColumn: '',
            customCard: '',
            customCardHover: ''
        };

        this._hoverConfig = {
            enabled: true,
            transitionDuration: 250,
            cardScale: 1.03,
            cardElevation: 8
        };
    }

    private getShadowValue(intensity: string, customValue = ''): string {
        if (intensity === 'Custom' && customValue) {
            return customValue;
        }

        switch (intensity) {
            case 'None':
                return 'none';
            case 'Subtle':
                return '0 1px 2px rgba(0, 0, 0, 0.05)';
            case 'Medium':
                return '0 4px 6px rgba(0, 0, 0, 0.1)';
            case 'Strong':
                return '0 10px 15px rgba(0, 0, 0, 0.15)';
            default:
                return '0 1px 3px rgba(0, 0, 0, 0.1)';
        }
    }

    private getHoverShadowValue(intensity: string, customValue = ''): string {
        if (intensity === 'Custom' && customValue) {
            return customValue;
        }

        switch (intensity) {
            case 'None':
                return 'none';
            case 'Subtle':
                return '0 2px 4px rgba(0, 0, 0, 0.08)';
            case 'Medium':
                return '0 8px 25px rgba(0, 0, 0, 0.15)';
            case 'Strong':
                return '0 20px 40px rgba(0, 0, 0, 0.25)';
            default:
                return '0 8px 25px rgba(0, 0, 0, 0.15)';
        }
    }

    private loadData(): void {
        console.log("Loading Data...");

        const dataSet = this._context.parameters.taskDataSet;
        const legacyData = this._context.parameters.tasksData;

        // 1. Try Dataset
        if (dataSet && dataSet.loading === false && dataSet.sortedRecordIds && dataSet.sortedRecordIds.length > 0) {
            console.log("Loading from Dataset");
            this.loadFromDataset();

            // If dataset loading resulted in 0 tasks (e.g. empty records), fallback to samples
            if (Object.keys(this._boardData.tasks).length === 0) {
                console.log("Dataset yielded no tasks. Falling back to Samples.");
                this._boardData = this.getEmptyBoardDataWithSamples();
            }
        }
        // 2. Try JSON Property
        else if (legacyData && legacyData.raw) {
            console.log("Loading from JSON");
            this.loadFromLegacyData();
        }
        // 3. Fallback to Samples
        else {
            console.log("Loading Samples (Fallback)");
            this._boardData = this.getEmptyBoardDataWithSamples();
        }
    }

    private loadFromDataset(): void {
        // Initialize empty board structure to populate
        const tasks: Record<string, Task> = {};

        // Clear existing task IDs in columns but keep the column structure
        Object.keys(this._boardData.columns).forEach(colId => {
            this._boardData.columns[colId].taskIds = [];
        });

        const dataSet = this._context.parameters.taskDataSet;

        if (!dataSet || !dataSet.sortedRecordIds) return;

        dataSet.sortedRecordIds.forEach(recordId => {
            const record = dataSet.records[recordId];

            // Safe helper to get value or alias
            const getValue = (alias: string) => {
                try {
                    // Debug what values we are getting
                    const val = record.getFormattedValue(alias);
                    return val;
                } catch (e) {
                    return "";
                }
            };

            console.log("Record:", recordId, "Title:", getValue('title'), "Status:", getValue('status'));

            // Detect if this is just harness mock data (all values are 'val')
            if (getValue('title') === 'val' && getValue('status') === 'val') {
                console.log("Detected Harness Mock Data (val). Skipping dataset to use rich samples.");
                return; // Skip this record
            }

            const task: Task = {
                id: getValue('id') || recordId,
                title: getValue('title') || 'Untitled',
                status: getValue('status') || 'Unknown',
                priority: getValue('priority'),
                assignedTo: getValue('assignedto'),
                dueDate: getValue('duedate'),
                description: getValue('description'),
                recordId: recordId,
                authorFirstName: getValue('authorFirstNameField')
            };

            // OPTIMISTIC CHECK: If this task was recently moved locally, prevent dataset from overwriting it immediately
            if (this._boardData.tasks[task.id] && this._boardData.tasks[task.id].isOptimistic) {
                const currentOptimisticStatus = this._boardData.tasks[task.id].status;
                const incomingStatus = getValue('status') || 'Unknown';

                // Normalize for comparison
                if (currentOptimisticStatus !== incomingStatus) {
                    // The dataset is still stale (old status), but we moved it.
                    // Keep our local version.
                    task.status = currentOptimisticStatus;
                    task.isOptimistic = true; // Keep flag
                } else {
                    // Dataset caught up!
                    task.isOptimistic = false;
                }
            }

            // Add to tasks map
            tasks[task.id] = task;

            // Assign to column
            const columnId = this.getColumnIdByStatus(task.status);
            if (columnId && this._boardData.columns[columnId]) {
                this._boardData.columns[columnId].taskIds.push(task.id);
            } else {
                // If no matching column, maybe put in first column or a 'fallback' column?
                // For now, put in first column
                const firstColId = this._boardData.columnOrder[0];
                if (firstColId) {
                    this._boardData.columns[firstColId].taskIds.push(task.id);
                }
            }
        });

        this._boardData.tasks = tasks;
    }

    private loadFromLegacyData(): void {
        try {
            const parsedData = JSON.parse(this._context.parameters.tasksData.raw!);
            // Merge with empty board to ensure structure
            const emptyBoard = this.getEmptyBoardData();

            // If the JSON contains full board data (columns + tasks)
            if (parsedData.columns && parsedData.tasks) {
                this._boardData = { ...emptyBoard, ...parsedData };
            }
            // If it's just an array of tasks (simplified JSON input)
            else if (Array.isArray(parsedData)) {
                this._boardData = emptyBoard;
                parsedData.forEach((t: unknown) => {
                    const task = t as Task;
                    this._boardData.tasks[task.id] = task;
                    const colId = this.getColumnIdByStatus(task.status);
                    if (colId) this._boardData.columns[colId].taskIds.push(task.id);
                });
            }
            else {
                this._boardData = { ...emptyBoard, ...parsedData };
            }
        } catch (e) {
            console.warn("Failed to parse tasks data (JSON)", e);
            // Don't overwrite if we failed
        }
    }

    private getEmptyBoardDataWithSamples(): BoardData {
        const columns: Record<string, Column> = {};
        const columnOrder: string[] = [];

        this._columnDefinitions.forEach(colDef => {
            columns[colDef.id] = {
                id: colDef.id,
                title: colDef.title,
                taskIds: [],
                statusValues: colDef.statusValues,
                color: colDef.color
            };
            columnOrder.push(colDef.id);
        });

        // Sample tasks with author information
        const sampleTasks: Record<string, Task> = {
            'task-1': {
                id: 'task-1',
                title: 'Implement new API endpoints',
                status: 'Todo',
                priority: 'high',
                dueDate: 'Today',
                assignedTo: 'john.smith@company.com',
                authorFirstName: 'John',
                authorLastName: 'Smith',
                authorEmail: 'john.smith@company.com',
                authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                description: 'Design and implement RESTful API endpoints for the new user management module. Ensure proper authentication, validation, and error handling are in place. Documentation must be updated with Swagger examples and response schemas.'
            },
            'task-2': {
                id: 'task-2',
                title: 'Fix user interface bug',
                status: 'In Progress',
                priority: 'medium',
                dueDate: 'Tomorrow',
                assignedTo: 'mary.johnson@company.com',
                authorFirstName: 'Mary',
                authorLastName: 'Johnson',
                authorEmail: 'mary.johnson@company.com',
                description: 'Investigate the alignment issue on the dashboard where the navigation bar overlaps with the content area on mobile devices. Fix the CSS media queries and verify across different screen sizes to ensure a responsive layout.'
            },
            'task-3': {
                id: 'task-3',
                title: 'Update documentation',
                status: 'Review',
                priority: 'low',
                dueDate: 'Next week',
                assignedTo: 'sarah.wilson@company.com',
                authorFirstName: 'Sarah',
                authorLastName: 'Wilson',
                authorEmail: 'sarah.wilson@company.com',
                authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612c3c5?w=100&h=100&fit=crop&crop=face',
                description: 'Review and update the project README and internal developer guides. Include instructions for setting up the local environment and running the new test suite. Ensure all deprecated API references are removed.'
            },
            'task-4': {
                id: 'task-4',
                title: 'Test new features',
                status: 'Done',
                priority: 'high',
                dueDate: 'Yesterday',
                assignedTo: 'mike.davis@company.com',
                authorFirstName: 'Mike',
                authorLastName: 'Davis',
                authorEmail: 'mike.davis@company.com',
                description: 'Execute the regression test suite for the payment gateway integration. Log any defects found in the issue tracker and verify fixes for previously reported critical bugs. Generate a final test report for the release.'
            },
            'task-5': {
                id: 'task-5',
                title: 'Prepare client presentation',
                status: 'Todo',
                priority: 'medium',
                dueDate: 'Friday',
                assignedTo: 'anna.brown@company.com',
                authorFirstName: 'Anna',
                authorLastName: 'Brown',
                authorEmail: 'anna.brown@company.com',
                authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                description: 'Create a slide deck for the Q3 progress review with the client. Highlight key milestones achieved, budget utilization, and upcoming risks. Practice the demo flow to ensure a smooth presentation during the meeting.'
            },
            'task-6': {
                id: 'task-6',
                title: 'Code review and merge requests',
                status: 'In Progress',
                priority: 'low',
                dueDate: 'Monday',
                assignedTo: 'david.taylor@company.com',
                authorFirstName: 'David',
                authorLastName: 'Taylor',
                authorEmail: 'david.taylor@company.com'
            }
        };

        // Assign tasks to columns
        columns['todo'].taskIds = ['task-1', 'task-5'];
        columns['inprogress'].taskIds = ['task-2', 'task-6'];
        columns['review'].taskIds = ['task-3'];
        columns['done'].taskIds = ['task-4'];

        return {
            tasks: sampleTasks,
            columns,
            columnOrder
        };
    }

    private getColumnIdByStatus(status: string): string | null {
        for (const column of this._columnDefinitions) {
            if (column.statusValues.some(val => val.toLowerCase() === status.toLowerCase())) {
                return column.id;
            }
        }
        return this._columnDefinitions[0]?.id || null;
    }

    private getEmptyBoardData(): BoardData {
        const columns: Record<string, Column> = {};
        const columnOrder: string[] = [];

        this._columnDefinitions.forEach(colDef => {
            columns[colDef.id] = {
                id: colDef.id,
                title: colDef.title,
                taskIds: [],
                statusValues: colDef.statusValues,
                color: colDef.color
            };
            columnOrder.push(colDef.id);
        });

        return {
            tasks: {},
            columns,
            columnOrder
        };
    }

    private renderBoard(): void {
        this.applyCustomStyles();

        const boardHeight = this._context.parameters.boardHeight?.raw || 0;
        const enableDragDrop = this._context.parameters.enableDragDrop?.raw !== false;

        this._container.innerHTML = '';
        this._container.className = 'kanban-board-container';
        // Dynamic height: 0 means 100% (fill parent), otherwise fixed pixel height
        this._container.style.height = boardHeight > 0 ? `${boardHeight}px` : '100%';
        if (boardHeight <= 0) {
            this._container.style.minHeight = '100vh'; // Ensure full height in harness
        }
        this._container.style.overflow = 'auto';
        this._container.style.fontFamily = this._styleConfig.fontFamily;
        this._container.style.fontSize = `${this._styleConfig.fontSize}px`;
        this._container.style.background = this._styleConfig.backgroundColor;
        this._container.style.color = this._styleConfig.textColor;

        this.applyBoardAlignment(this._container);

        const boardWrapper = document.createElement('div');

        console.log("Rendering Board Data:", {
            tasks: this._boardData ? Object.keys(this._boardData.tasks).length : 'No Data',
            columns: this._boardData ? this._boardData.columnOrder.length : 'No Data',
            columnOrder: this._boardData?.columnOrder
        });
        boardWrapper.className = 'kanban-board-wrapper';
        boardWrapper.style.display = 'flex';
        boardWrapper.style.gap = `${this._layoutConfig.columnSpacing}px`;
        boardWrapper.style.height = '100%';
        boardWrapper.style.padding = `${this._context.parameters.cardSpacing?.raw || 10}px`; // Use card spacing or a board padding default

        this.applyColumnsAlignment(boardWrapper);

        const totalColumns = this._boardData.columnOrder.length;
        let columnWidth = this._layoutConfig.columnWidth;

        if (columnWidth <= 0 || isNaN(columnWidth)) {
            // Fallback to container width or window width or safe default
            const containerWidth = this._container.clientWidth || window.innerWidth || 1024;
            const availableWidth = containerWidth - (this._layoutConfig.columnSpacing * (totalColumns + 1));

            // Ensure we have a valid number for calculation
            const safeAvailableWidth = Math.max(availableWidth, 300 * totalColumns); // Ensure at least some width

            columnWidth = Math.max(
                this._layoutConfig.columnMinWidth,
                Math.min(this._layoutConfig.columnMaxWidth, safeAvailableWidth / (totalColumns || 1))
            );
        }

        this._boardData.columnOrder.forEach((columnId) => {
            const column = this._boardData.columns[columnId];
            if (column) {
                const columnElement = this.createColumn(column, columnWidth, enableDragDrop);
                boardWrapper.appendChild(columnElement);
            }
        });

        this._container.appendChild(boardWrapper);
    }

    private applyBoardAlignment(container: HTMLElement): void {
        switch (this._alignmentConfig.boardHorizontal) {
            case 'Center':
                container.style.display = 'flex';
                container.style.justifyContent = 'center';
                break;
            case 'Right':
                container.style.display = 'flex';
                container.style.justifyContent = 'flex-end';
                break;
            case 'Stretch':
                container.style.width = '100%';
                break;
            default:
                container.style.display = 'flex';
                container.style.justifyContent = 'flex-start';
        }
    }

    private applyColumnsAlignment(wrapper: HTMLElement): void {
        wrapper.style.display = 'flex';
        wrapper.style.height = '100%';
        wrapper.style.padding = `${this._layoutConfig.columnSpacing}px`;
        wrapper.style.gap = `${this._layoutConfig.columnSpacing}px`;

        switch (this._alignmentConfig.columnsHorizontal) {
            case 'Center':
                wrapper.style.justifyContent = 'center';
                break;
            case 'Right':
                wrapper.style.justifyContent = 'flex-end';
                break;
            case 'Stretch':
                wrapper.style.justifyContent = 'stretch';
                break;
            default:
                wrapper.style.justifyContent = 'flex-start';
        }
    }

    private createColumn(column: Column, width: number, enableDragDrop: boolean): HTMLElement {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'kanban-column';
        columnDiv.className = 'kanban-column';

        // Responsive Width Logic
        if (width > 0) {
            // Fixed width mode
            columnDiv.style.flex = `0 0 ${width}px`;
        } else {
            // Auto-fit mode (equal distribution)
            columnDiv.style.flex = '1 1 0px';
        }

        // Apply min/max constraints if defined
        if (this._layoutConfig.columnMinWidth > 0) {
            columnDiv.style.minWidth = `${this._layoutConfig.columnMinWidth}px`;
        }
        if (this._layoutConfig.columnMaxWidth > 0 && this._layoutConfig.columnMaxWidth < 9999) {
            columnDiv.style.maxWidth = `${this._layoutConfig.columnMaxWidth}px`;
        }
        columnDiv.style.minHeight = '400px';
        columnDiv.style.backgroundColor = column.color || this._styleConfig.columnBackgroundColor;
        columnDiv.style.borderRadius = '12px';
        columnDiv.style.border = `1px solid ${this.hexToRgba(this._styleConfig.primaryColor, 0.2)}`;
        columnDiv.setAttribute('data-column-id', column.id);

        const header = this.createColumnHeader(column);
        columnDiv.appendChild(header);

        const tasksContainer = this.createTasksContainer(column, enableDragDrop);
        columnDiv.appendChild(tasksContainer);

        return columnDiv;
    }

    private createColumnHeader(column: Column): HTMLElement {
        const header = document.createElement('div');
        header.className = 'kanban-column-header';
        header.style.padding = '12px';
        header.style.borderBottom = `1px solid ${this.hexToRgba(this._styleConfig.primaryColor, 0.2)}`;
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.backgroundColor = this._styleConfig.cardBackgroundColor;
        header.style.borderRadius = '12px 12px 0 0';

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '8px';

        const title = document.createElement('h3');
        title.textContent = column.title;
        title.style.margin = '0';
        title.style.fontSize = `${this._styleConfig.fontSize}px`;
        title.style.fontWeight = '600';
        title.style.color = this._styleConfig.textColor;
        title.style.fontFamily = this._styleConfig.fontFamily;
        title.style.textAlign = this._alignmentConfig.text.toLowerCase() as 'left' | 'center' | 'right' | 'justify';

        const taskCount = document.createElement('span');
        taskCount.textContent = column.taskIds.length.toString();
        taskCount.style.backgroundColor = this.hexToRgba(this._styleConfig.primaryColor, 0.1);
        taskCount.style.color = this._styleConfig.primaryColor;
        taskCount.style.fontSize = `${Math.max(10, this._styleConfig.fontSize - 2)}px`;
        taskCount.style.padding = '2px 8px';
        taskCount.style.borderRadius = '12px';
        taskCount.style.fontWeight = '500';
        taskCount.style.fontFamily = this._styleConfig.fontFamily;

        titleContainer.appendChild(title);
        titleContainer.appendChild(taskCount);
        header.appendChild(titleContainer);

        return header;
    }

    private createTasksContainer(column: Column, enableDragDrop: boolean): HTMLElement {
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'kanban-tasks-container';
        tasksContainer.style.padding = `${this._layoutConfig.cardSpacing}px`;
        tasksContainer.style.minHeight = '300px';
        tasksContainer.style.overflowY = 'auto';
        tasksContainer.setAttribute('data-column-id', column.id);

        this.applyCardsVerticalAlignment(tasksContainer);

        if (enableDragDrop) {
            this.setupDropZone(tasksContainer);
        }

        column.taskIds.forEach((taskId) => {
            const task = this._boardData.tasks[taskId];
            if (task) {
                const taskElement = this.createTaskCard(task, enableDragDrop);
                tasksContainer.appendChild(taskElement);
            }
        });

        return tasksContainer;
    }

    private applyCardsVerticalAlignment(container: HTMLElement): void {
        switch (this._alignmentConfig.cardsVertical) {
            case 'Middle':
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.justifyContent = 'center';
                break;
            case 'Bottom':
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.justifyContent = 'flex-end';
                break;
            case 'Stretch':
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.justifyContent = 'stretch';
                break;
            default:
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.justifyContent = 'flex-start';
        }
    }


    private createTaskCard(task: Task, enableDragDrop: boolean): HTMLElement {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'kanban-task-card fluent-card';
        taskDiv.style.backgroundColor = this._styleConfig.cardBackgroundColor;
        taskDiv.style.border = '1px solid #E5E7EB'; // Specification color
        taskDiv.style.borderRadius = '16px'; // Celkový kontejner: Radius 16px
        taskDiv.style.marginBottom = `${this._layoutConfig.cardSpacing}px`;
        taskDiv.style.cursor = enableDragDrop ? 'grab' : 'default';
        taskDiv.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
        taskDiv.style.transition = `all ${this._hoverConfig.transitionDuration}ms ease`;
        taskDiv.style.fontFamily = this._styleConfig.fontFamily;
        taskDiv.style.position = 'relative';
        taskDiv.style.display = 'flex';
        taskDiv.style.flexDirection = 'column';
        taskDiv.style.overflow = 'hidden';

        taskDiv.setAttribute('data-task-id', task.id);

        // --- A) HEADER BLOCK (Top Row) ---
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.flexDirection = 'row';
        header.style.gap = '12px'; // Small gap between avatar and text
        header.style.padding = '20px 20px 0 20px'; // Generous padding, no bottom
        header.style.alignItems = 'flex-start'; // Align to top

        // Object 1: Avatar (Left anchor)
        if (this._authorConfig.showAvatar) {
            const avatarContainer = document.createElement('div');
            avatarContainer.style.width = '40px'; // Fixed size
            avatarContainer.style.height = '40px';
            avatarContainer.style.flexShrink = '0'; // Prevent shrinking
            const avatar = this.createAuthorAvatar(task);
            if (avatar) {
                avatar.style.width = '100%';
                avatar.style.height = '100%';
                avatarContainer.appendChild(avatar);
                header.appendChild(avatarContainer);
            }
        }

        // Object 2: Text Group (Right of avatar)
        const titlesContainer = document.createElement('div');
        titlesContainer.style.display = 'flex';
        titlesContainer.style.flexDirection = 'column'; // Vertical stack
        titlesContainer.style.justifyContent = 'center';
        titlesContainer.style.overflow = 'hidden';
        titlesContainer.style.flex = '1 1 0'; // Allow shrinking and growing from 0 base
        titlesContainer.style.minWidth = '0'; // Critical for text truncation in flexbox
        titlesContainer.style.maxWidth = '100%'; // Don't exceed parent

        // Row 1: Title - FIRST (top) - [4] NADPIS
        const lblTitle = document.createElement('div');
        // Remove className to avoid CSS conflicts
        lblTitle.textContent = task.title;
        lblTitle.setAttribute('title', task.title); // Hover tooltip
        // Use setProperty with !important to override any CSS
        lblTitle.style.setProperty('font-weight', '700', 'important'); // [4] Bold
        lblTitle.style.setProperty('font-size', '15px', 'important');
        lblTitle.style.setProperty('color', '#111827', 'important'); // [4] Barva: Tmavá
        lblTitle.style.setProperty('line-height', '1.4', 'important');
        lblTitle.style.setProperty('white-space', 'nowrap', 'important');
        lblTitle.style.setProperty('overflow', 'hidden', 'important');
        lblTitle.style.setProperty('text-overflow', 'ellipsis', 'important');
        lblTitle.style.setProperty('max-width', '100%', 'important');
        lblTitle.style.setProperty('width', '100%', 'important');
        lblTitle.style.setProperty('display', 'block', 'important');
        lblTitle.style.setProperty('word-break', 'keep-all', 'important');
        lblTitle.style.setProperty('word-wrap', 'normal', 'important');

        // Row 2: Date (Meta) - SECOND (below title) - [5] DATUM
        const lblSubtitle = document.createElement('div');
        lblSubtitle.className = 'task-subtitle';
        lblSubtitle.textContent = task.dueDate || 'Today';
        lblSubtitle.style.fontWeight = '400'; // Regular
        lblSubtitle.style.fontSize = '13px';
        lblSubtitle.style.color = '#6B7280'; // [5] Barva: Šedá
        lblSubtitle.style.marginTop = '4px'; // Small gap after title
        lblSubtitle.style.textAlign = 'left'; // Align with title start

        titlesContainer.appendChild(lblTitle); // Title first
        titlesContainer.appendChild(lblSubtitle); // Date second
        header.appendChild(titlesContainer);
        taskDiv.appendChild(header);

        // --- B) CONTENT BLOCK (Middle Row) - [7] BLOK TEXTU
        if (task.description) {
            const body = document.createElement('div');
            body.style.padding = '0 20px'; // [1] Padding - šířka se roztahuje do stran
            body.style.marginTop = '16px'; // [6] MEZERA: 16px vertikálně
            body.style.fontSize = '15px'; // Increased from 14px
            body.style.color = '#374151'; // [7] Barva: Tmavě šedá
            body.style.lineHeight = '1.5'; // [7] Line-height: 1.5

            // Multiline clamping for description
            if (this._textConfig.enableMultiline) {
                body.style.whiteSpace = 'normal';
                body.style.display = '-webkit-box';
                body.style.webkitLineClamp = '3'; // Limit to 3 lines
                body.style.webkitBoxOrient = 'vertical';
                body.style.overflow = 'hidden';
            } else {
                body.style.whiteSpace = 'nowrap';
                body.style.overflow = 'hidden';
                body.style.textOverflow = 'ellipsis';
            }
            body.textContent = task.description;
            body.title = task.description;
            taskDiv.appendChild(body);
        }

        if (enableDragDrop) {
            this.setupDragEvents(taskDiv);
        }


        // --- C) FOOTER BLOCK (Bottom Row) ---
        const footer = document.createElement('div');
        footer.style.marginTop = '8px'; // Smaller spacing

        // [9] LINKA (Divider) - Full-width
        const divider = document.createElement('div');
        divider.style.width = '100%';
        divider.style.height = '1px'; // [9] Výška 1px
        divider.style.backgroundColor = '#E5E7EB'; // [9] Barva: Velmi světle šedá
        divider.style.marginBottom = '8px'; // Smaller spacing
        footer.appendChild(divider);

        // Footer content row (Space Between layout)
        const footerRow = document.createElement('div');
        footerRow.style.display = 'flex';
        footerRow.style.justifyContent = 'space-between'; // Spread items to sides
        footerRow.style.alignItems = 'center'; // Vertical center alignment
        footerRow.style.padding = '0 20px 8px 20px'; // Smaller bottom padding

        // [11] Badge (Priorita) - Object Left
        if (this._showPriorityBadge && task.priority) {
            const priorityBadge = document.createElement('div');
            priorityBadge.className = 'priority-badge';
            priorityBadge.innerText = task.priority.toUpperCase();
            priorityBadge.style.padding = '4px 12px'; // [11] Pill shape
            priorityBadge.style.borderRadius = '999px'; // [11] Plně zaoblený (Pill)
            priorityBadge.style.fontSize = '11px';
            priorityBadge.style.fontWeight = '600';
            priorityBadge.style.letterSpacing = '0.5px';
            priorityBadge.style.height = '24px'; // [11] Výška 24px
            priorityBadge.style.display = 'inline-flex';
            priorityBadge.style.alignItems = 'center';

            const p = (task.priority || '').toLowerCase();
            if (p === 'high' || p === 'urgent') {
                // [11] HIGH: #FEE2E2 pozadí, #B91C1C text
                priorityBadge.style.backgroundColor = '#FEE2E2';
                priorityBadge.style.color = '#B91C1C';
            } else if (p === 'medium' || p === 'normal') {
                priorityBadge.style.backgroundColor = '#fef3c7';
                priorityBadge.style.color = '#d97706';
            } else {
                priorityBadge.style.backgroundColor = '#dbeafe';
                priorityBadge.style.color = '#2563eb';
            }

            footerRow.appendChild(priorityBadge);
        } else {
            const spacer = document.createElement('div');
            footerRow.appendChild(spacer);
        }

        // [12] Icon (Sdílet) - Object Right
        const shareBtn = document.createElement('div');
        shareBtn.className = 'share-btn';
        // [12] Velikost ikony cca 20x20px, Barva: Šedá (#9CA3AF)
        const svgShare = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 3C13 2.44772 13.4477 2 14 2H18C18.5523 2 19 2.44772 19 3V7C19 7.55228 18.5523 8 18 8C17.4477 8 17 7.55228 17 7V5.41421L11.7071 10.7071C11.3166 11.0976 10.6834 11.0976 10.2929 10.7071C9.90237 10.3166 9.90237 9.68342 10.2929 9.29289L15.5858 4H14C13.4477 4 13 3.55228 13 3ZM9 3C9.55228 3 10 3.44772 10 4C10 4.55228 9.55228 5 9 5H4V16H15V11C15 10.4477 15.4477 10 16 10C16.5523 10 17 10.4477 17 11V16C17 17.1046 16.1046 18 15 18H4C2.89543 18 2 17.1046 2 16V5C2 3.89543 2.89543 3 4 3H9Z" fill="#9CA3AF"/></svg>';
        shareBtn.innerHTML = svgShare;
        shareBtn.style.cursor = 'pointer';
        shareBtn.style.display = 'flex';
        shareBtn.style.alignItems = 'center';
        shareBtn.style.justifyContent = 'center';
        shareBtn.style.padding = '4px';
        shareBtn.style.borderRadius = '4px';
        shareBtn.style.transition = 'background-color 0.15s';
        shareBtn.onmouseover = () => shareBtn.style.backgroundColor = '#f3f4f6';
        shareBtn.onmouseout = () => shareBtn.style.backgroundColor = 'transparent';
        shareBtn.onclick = (e) => {
            e.stopPropagation();

            // Remove any existing overlay
            const existingOverlay = document.querySelector('.kanban-overlay');
            if (existingOverlay) existingOverlay.remove();

            // 1. Create Overlay (Cover the board) with glassmorphism
            const overlay = document.createElement('div');
            overlay.className = 'kanban-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = this._shareModalConfig.overlayColor || 'rgba(0, 0, 0, 0.4)';
            overlay.style.backdropFilter = 'blur(8px)'; // Glassmorphism blur
            overlay.style.setProperty('-webkit-backdrop-filter', 'blur(8px)'); // Safari support
            overlay.style.zIndex = '1000';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.onclick = () => overlay.remove();

            // 2. Create Modal Popup - SOLID WHITE, NO transparency
            const sharePopup = document.createElement('div');
            sharePopup.className = 'share-popup';
            sharePopup.style.position = 'relative';
            sharePopup.style.display = 'flex';
            sharePopup.style.flexDirection = 'column';
            // Force solid white background - ignore config for now
            sharePopup.style.backgroundColor = '#ffffff';
            sharePopup.style.setProperty('background-color', '#ffffff', 'important');
            sharePopup.style.setProperty('background', '#ffffff', 'important');
            sharePopup.style.borderRadius = '12px';
            sharePopup.style.padding = '16px';
            sharePopup.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            sharePopup.style.width = '420px';
            sharePopup.style.gap = '12px';
            sharePopup.style.zIndex = '1001';
            sharePopup.style.opacity = '1'; // Explicitly solid
            sharePopup.style.backdropFilter = 'none'; // NO glassmorphism on popup itself
            sharePopup.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
            sharePopup.style.setProperty('backdrop-filter', 'none', 'important');
            sharePopup.onclick = (ev) => ev.stopPropagation();

            // Header with email recipient and close button
            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.marginBottom = '4px';

            const headerTitle = document.createElement('h2');
            const emailAddress = task.assignedTo || 'alex.morgan@company.com';
            headerTitle.textContent = `Send message to ${emailAddress}`;
            headerTitle.setAttribute('title', emailAddress); // Hover tooltip for full email
            headerTitle.style.fontSize = '18px';
            headerTitle.style.fontWeight = '600';
            headerTitle.style.color = '#111827';
            headerTitle.style.margin = '0';
            headerTitle.style.overflow = 'hidden';
            headerTitle.style.textOverflow = 'ellipsis';
            headerTitle.style.whiteSpace = 'nowrap';
            headerTitle.style.flex = '1';

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '28px';
            closeBtn.style.color = '#9ca3af';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '0';
            closeBtn.style.width = '32px';
            closeBtn.style.height = '32px';
            closeBtn.style.display = 'flex';
            closeBtn.style.alignItems = 'center';
            closeBtn.style.justifyContent = 'center';
            closeBtn.style.flexShrink = '0';
            closeBtn.onclick = () => overlay.remove();
            closeBtn.onmouseover = () => closeBtn.style.color = '#6b7280';
            closeBtn.onmouseout = () => closeBtn.style.color = '#9ca3af';

            headerDiv.appendChild(headerTitle);
            headerDiv.appendChild(closeBtn);
            sharePopup.appendChild(headerDiv);

            // Subject field
            const subjectContainer = document.createElement('div');
            subjectContainer.style.marginTop = '4px'; // Reduced from 16px

            const subjectLabel = document.createElement('label');
            subjectLabel.textContent = 'SUBJECT';
            subjectLabel.style.display = 'block';
            subjectLabel.style.fontSize = '11px';
            subjectLabel.style.fontWeight = '600';
            subjectLabel.style.color = '#6b7280';
            subjectLabel.style.marginBottom = '2px'; // Reduced from 8px
            subjectLabel.style.letterSpacing = '0.5px';

            const subjectInput = document.createElement('input');
            subjectInput.type = 'text';
            subjectInput.value = task.title;
            subjectInput.style.width = '100%';
            subjectInput.style.padding = '6px 8px';
            subjectInput.style.border = '1px solid #e5e7eb';
            subjectInput.style.borderRadius = '6px';
            subjectInput.style.fontSize = '14px';
            subjectInput.style.color = '#111827';
            subjectInput.style.backgroundColor = '#f9fafb';
            subjectInput.style.boxSizing = 'border-box';
            subjectInput.onclick = (ev) => ev.stopPropagation();

            subjectContainer.appendChild(subjectLabel);
            subjectContainer.appendChild(subjectInput);
            sharePopup.appendChild(subjectContainer);

            // Message field
            const bodyDiv = document.createElement('div');
            bodyDiv.style.marginTop = '8px'; // Reduced from 16px

            const lblMsg = document.createElement('label');
            lblMsg.textContent = 'MESSAGE';
            lblMsg.style.display = 'block';
            lblMsg.style.fontSize = '11px';
            lblMsg.style.fontWeight = '600';
            lblMsg.style.color = '#6b7280';
            lblMsg.style.marginBottom = '2px'; // Reduced from 8px
            lblMsg.style.letterSpacing = '0.5px';

            const txtMsg = document.createElement('textarea');
            txtMsg.placeholder = 'Add a message...';
            txtMsg.style.width = '100%';
            txtMsg.style.height = '80px';
            txtMsg.style.padding = '6px 8px';
            txtMsg.style.border = '1px solid #e5e7eb';
            txtMsg.style.borderRadius = '6px';
            txtMsg.style.fontSize = '14px';
            txtMsg.style.color = '#111827';
            txtMsg.style.backgroundColor = '#ffffff';
            txtMsg.style.resize = 'vertical';
            txtMsg.style.fontFamily = 'inherit';
            txtMsg.style.boxSizing = 'border-box';
            txtMsg.onclick = (ev) => ev.stopPropagation();

            bodyDiv.appendChild(lblMsg);
            bodyDiv.appendChild(txtMsg);
            sharePopup.appendChild(bodyDiv);

            // Teams and Email icons
            const methodsDiv = document.createElement('div');
            methodsDiv.style.display = 'flex';
            methodsDiv.style.gap = '16px'; // Same gap as original buttons
            methodsDiv.style.marginTop = '8px';
            methodsDiv.style.justifyContent = 'center'; // Center the icons

            // Teams icon button (icon only)
            const btnTeams = document.createElement('div');
            btnTeams.style.display = 'flex';
            btnTeams.style.alignItems = 'center';
            btnTeams.style.justifyContent = 'center';
            btnTeams.style.width = '56px';
            btnTeams.style.height = '56px';
            btnTeams.style.padding = '8px';
            btnTeams.style.borderRadius = '12px';
            btnTeams.style.cursor = 'pointer';
            btnTeams.style.transition = 'all 0.15s';
            btnTeams.style.boxSizing = 'border-box';
            btnTeams.setAttribute('title', 'Send via Teams');
            // Teams icon - Scaled up
            btnTeams.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="4" fill="#5059C9"/><path d="M8 8h12v3H8V8zm0 5h8v7H8v-7zm10 0h2v7h-2v-7z" fill="white"/><circle cx="21" cy="6" r="3" fill="#7B83EB"/><circle cx="7" cy="6" r="2" fill="#7B83EB"/></svg>';
            btnTeams.onclick = (ev) => {
                ev.stopPropagation();
                console.log(`Shared to Teams: ${txtMsg.value}`);
                overlay.remove();
            };
            btnTeams.onmouseover = () => {
                btnTeams.style.backgroundColor = '#f3f4f6';
            };
            btnTeams.onmouseout = () => {
                btnTeams.style.backgroundColor = 'transparent';
            };

            // Outlook icon button (icon only)
            const btnEmail = document.createElement('div');
            btnEmail.style.display = 'flex';
            btnEmail.style.alignItems = 'center';
            btnEmail.style.justifyContent = 'center';
            btnEmail.style.width = '56px';
            btnEmail.style.height = '56px';
            btnEmail.style.padding = '8px';
            btnEmail.style.borderRadius = '12px';
            btnEmail.style.cursor = 'pointer';
            btnEmail.style.transition = 'all 0.15s';
            btnEmail.style.boxSizing = 'border-box';
            btnEmail.setAttribute('title', 'Send via Email');
            // Outlook icon - Scaled up
            btnEmail.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 28 28" fill="none"><rect x="2" y="5" width="24" height="18" rx="3" fill="#0078D4"/><path d="M2 8l12 8 12-8" stroke="white" stroke-width="2" fill="none"/></svg>';
            btnEmail.onclick = (ev) => {
                ev.stopPropagation();
                console.log(`Shared to Email: ${txtMsg.value}`);
                overlay.remove();
            };
            btnEmail.onmouseover = () => {
                btnEmail.style.backgroundColor = '#f3f4f6';
            };
            btnEmail.onmouseout = () => {
                btnEmail.style.backgroundColor = 'transparent';
            };

            methodsDiv.appendChild(btnTeams);
            methodsDiv.appendChild(btnEmail);
            sharePopup.appendChild(methodsDiv);

            overlay.appendChild(sharePopup);
            this._container.appendChild(overlay);
        };

        footerRow.appendChild(shareBtn);
        footer.appendChild(footerRow);
        taskDiv.appendChild(footer);

        return taskDiv;
    }

    // Removed createTaskContent as logic is integrated
    // Keeping createAuthorBadge logic inside creating avatar logic if needed, but 'createAuthorBadge' method itself might be dead code now. 
    // I will keep createAuthorBadge method signature but empty or strictly for avatar generation helper?
    // Actually I reused `createAuthorAvatar` helper directly. 
    // `createAuthorBadge` returned the whole "Pill" with name. We don't need that style anymore. 
    // I will just let `createAuthorBadge` exist to minimize diff noise or replace it.

    // Simplification: I'm replacing the whole block, so I can just drop createTaskContent.
    // I still need createAuthorAvatar.

    private createAuthorBadge(task: Task): HTMLElement | null {
        // Start Deprecated/Unused in new layout (Logic moved to Header)
        // But kept to satisfy any other internal calls if any?
        // No other calls.
        return null;
    }

    private createAuthorAvatar(task: Task): HTMLElement | null {
        // Only use explicit avatar URL. Do not fallback to assignedTo (which is often email).
        const avatarUrl = task.authorAvatar;

        // Setup avatar container
        const avatar = document.createElement('div');
        avatar.className = 'author-avatar';
        avatar.style.width = `${this._authorConfig.avatarSize}px`;
        avatar.style.height = `${this._authorConfig.avatarSize}px`;
        avatar.style.borderRadius = '50%';
        avatar.style.flexShrink = '0';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.fontSize = `${Math.max(8, this._authorConfig.avatarSize / 3)}px`;
        avatar.style.fontWeight = '600';

        // If it's a valid URL, try to load as image
        if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image'))) {
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';

            // Fallback to initials if image fails to load
            img.onerror = () => {
                avatar.removeChild(img);
                const initials = this.generateInitials(task);
                avatar.textContent = initials;
                avatar.style.backgroundColor = this.generateAvatarColor(initials);
                avatar.style.color = '#ffffff';
            };

            avatar.appendChild(img);
        } else {
            // Generate initials avatar
            const initials = this.generateInitials(task);
            avatar.textContent = initials;
            avatar.style.backgroundColor = this.generateAvatarColor(initials);
            avatar.style.color = '#ffffff';
        }

        return avatar;
    }

    private positionAuthorBadge(badge: HTMLElement, position: string): void {
        switch (position) {
            case 'Top Right':
                badge.style.top = '8px';
                badge.style.right = '8px';
                break;
            case 'Top Left':
                badge.style.top = '8px';
                badge.style.left = '8px';
                break;
            case 'Bottom Right':
                badge.style.bottom = '8px';
                badge.style.right = '8px';
                break;
            case 'Bottom Left':
                badge.style.bottom = '8px';
                badge.style.left = '8px';
                break;
            default: // Top Right
                badge.style.top = '8px';
                badge.style.right = '8px';
        }
    }

    private formatAuthorName(task: Task): string {
        const firstName = task.authorFirstName || '';
        const lastName = task.authorLastName || '';
        const email = task.authorEmail || task.assignedTo || '';

        switch (this._authorConfig.displayFormat) {
            case 'Full Name':
                if (firstName && lastName) {
                    return `${firstName} ${lastName}`;
                } else if (firstName) {
                    return firstName;
                } else if (lastName) {
                    return lastName;
                } else if (email) {
                    return email.split('@')[0]; // Use email username part
                }
                break;

            case 'First Name Only':
                return firstName || email.split('@')[0] || '';

            case 'Last Name Only':
                return lastName || email.split('@')[0] || '';

            case 'Initials':
                return this.generateInitials(task);

            case 'Email':
                return email;

            case 'Custom':
                return this.applyCustomFormat(task);

            default:
                if (firstName && lastName) {
                    return `${firstName} ${lastName}`;
                } else if (email) {
                    return email.split('@')[0];
                }
        }

        return '';
    }

    private generateInitials(task: Task): string {
        const firstName = task.authorFirstName || '';
        const lastName = task.authorLastName || '';
        const email = task.authorEmail || task.assignedTo || '';

        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        } else if (firstName) {
            return firstName.substring(0, 2).toUpperCase();
        } else if (lastName) {
            return lastName.substring(0, 2).toUpperCase();
        } else if (email) {
            const emailParts = email.split('@')[0];
            if (emailParts.includes('.')) {
                const nameParts = emailParts.split('.');
                return `${nameParts[0].charAt(0)}${nameParts[1]?.charAt(0) || ''}`.toUpperCase();
            } else {
                return emailParts.substring(0, 2).toUpperCase();
            }
        }

        return '??';
    }

    private applyCustomFormat(task: Task): string {
        const format = this._authorConfig.customFormat || '{firstName} {lastName}';

        return format.trim();
    }

    private generateAvatarColor(initials: string): string {
        // Generate consistent color based on initials
        const colors = [
            '#f87171', '#fb923c', '#facc15', '#a3e635',
            '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
            '#f472b6', '#fb7185', '#fbbf24', '#86efac',
            '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8'
        ];

        let hash = 0;
        for (let i = 0; i < initials.length; i++) {
            hash = initials.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }

    private createTaskMetadata(task: Task): HTMLElement {
        const metadata = document.createElement('div');
        metadata.className = 'task-metadata';
        metadata.style.display = 'flex';
        metadata.style.justifyContent = 'space-between';
        metadata.style.alignItems = 'center';
        metadata.style.fontSize = `${Math.max(10, this._styleConfig.fontSize - 2)}px`;
        metadata.style.color = this._styleConfig.secondaryTextColor;
        metadata.style.fontFamily = this._styleConfig.fontFamily;

        if (task.priority) {
            const priority = document.createElement('span');
            priority.textContent = task.priority;
            priority.style.padding = '2px 6px';
            priority.style.borderRadius = '4px';
            priority.style.fontSize = `${Math.max(8, this._styleConfig.fontSize - 4)}px`;
            priority.style.fontWeight = '500';
            priority.style.textTransform = 'uppercase';

            switch (task.priority.toLowerCase()) {
                case 'high':
                    priority.style.backgroundColor = this.hexToRgba(this._styleConfig.highPriorityColor, 0.2);
                    priority.style.color = this._styleConfig.highPriorityColor;
                    break;
                case 'medium':
                    priority.style.backgroundColor = this.hexToRgba(this._styleConfig.mediumPriorityColor, 0.2);
                    priority.style.color = this._styleConfig.mediumPriorityColor;
                    break;
                case 'low':
                    priority.style.backgroundColor = this.hexToRgba(this._styleConfig.lowPriorityColor, 0.2);
                    priority.style.color = this._styleConfig.lowPriorityColor;
                    break;
            }

            metadata.appendChild(priority);
        }

        if (task.dueDate || task.assignedTo) {
            const details = document.createElement('div');
            details.style.display = 'flex';
            details.style.gap = '8px';

            if (task.dueDate) {
                const dueDate = document.createElement('span');
                dueDate.textContent = task.dueDate;
                details.appendChild(dueDate);
            }

            // Email/Assignee removed as requested
            /* if (task.assignedTo) {
                const assignee = document.createElement('span');
                assignee.textContent = task.assignedTo;
                assignee.style.backgroundColor = this.hexToRgba(this._styleConfig.primaryColor, 0.1);
                assignee.style.color = this._styleConfig.primaryColor;
                assignee.style.padding = '2px 6px';
                assignee.style.borderRadius = '4px';
                details.appendChild(assignee);
            } */

            metadata.appendChild(details);
        }

        return metadata;
    }

    private moveTask(taskId: string, sourceColumnId: string, targetColumnId: string): void {
        if (sourceColumnId === targetColumnId) return;

        const sourceColumn = this._boardData.columns[sourceColumnId];
        const targetColumn = this._boardData.columns[targetColumnId];
        const task = this._boardData.tasks[taskId];

        if (!sourceColumn || !targetColumn || !task) return;

        const taskIndex = sourceColumn.taskIds.indexOf(taskId);
        if (taskIndex > -1) {
            sourceColumn.taskIds.splice(taskIndex, 1);
        }
        targetColumn.taskIds.push(taskId);

        task.status = targetColumn.statusValues[0] || targetColumn.title;

        // OPTIMISTIC UPDATE:
        // Mark this task as having a "pending" status so consecutive updates don't revert it
        // until we get a confirmation (or we just trust the UI state for a bit)
        task.isOptimistic = true;

        this.renderBoard();

        // Prepare Output to trigger Power Apps OnChange
        this._lastUpdatedTask = taskId;
        this._pendingUpdate = true;
        this._notifyOutputChanged();
    }

    public getOutputs(): IOutputs {
        const lastMovedTask = this._lastUpdatedTask ? this._boardData.tasks[this._lastUpdatedTask] : null;

        // Use a robust output object matching what typical Canvas Apps expect
        return {
            updatedTasksData: JSON.stringify(this._boardData),
            lastMovedTask: lastMovedTask ? JSON.stringify({
                taskId: lastMovedTask.recordId || lastMovedTask.id, // Prefer recordId for Patch
                newStatus: lastMovedTask.status,
                previousStatus: this._sourceColumnId ? this._boardData.columns[this._sourceColumnId].title : "",
                title: lastMovedTask.title,
                timestamp: new Date().toISOString()
            }) : ""
        };
    }

    private hexToRgba(hex: string, alpha: number): string {
        hex = hex.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private formatDate(date: Date): string {
        if (!date) return '';
        const now = new Date();
        const taskDate = new Date(date);
        const diffDays = Math.floor((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return taskDate.toLocaleDateString();
    }

    private applyCustomStyles(): void {
        let styleElement = document.getElementById('kanban-custom-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'kanban-custom-styles';
            document.head.appendChild(styleElement);
        }

        const customCSS = `
            .kanban-board-container {
                position: relative !important;
                font-family: '${this._styleConfig.fontFamily}', sans-serif !important;
                font-size: ${this._styleConfig.fontSize}px !important;
                background-color: ${this._styleConfig.backgroundColor} !important;
                color: ${this._styleConfig.textColor} !important;
                border-radius: ${this._radiusConfig.board}px !important;
                box-shadow: ${this.getShadowValue(this._shadowConfig.board, this._shadowConfig.customBoard)} !important;
            }

            .kanban-board-container * {
                box-sizing: border-box !important;
            }
            
            .kanban-column {
                background-color: ${this._styleConfig.columnBackgroundColor} !important;
                border-color: ${this._styleConfig.primaryColor}33 !important;
                border-radius: ${this._radiusConfig.column}px !important;
                box-shadow: ${this.getShadowValue(this._shadowConfig.column, this._shadowConfig.customColumn)} !important;
                transition: all ${this._hoverConfig.transitionDuration}ms ease !important;
            }
            
            .kanban-column:hover {
                ${this._hoverConfig.enabled ? `
                    transform: translateY(-2px);
                    box-shadow: ${this.getHoverShadowValue(this._shadowConfig.column, this._shadowConfig.customColumn)};
                ` : ''}
            }
            
            .kanban-task-card {
                position: relative !important;
                min-height: 140px !important;
                width: 100% !important;
                background-color: ${this._styleConfig.cardBackgroundColor} !important;
                border-color: ${this._styleConfig.primaryColor}33 !important;
                margin-bottom: ${this._layoutConfig.cardSpacing}px !important;
                border-radius: ${this._radiusConfig.card}px !important;
                box-shadow: ${this.getShadowValue(this._shadowConfig.card, this._shadowConfig.customCard)} !important;
                transition: all ${this._hoverConfig.transitionDuration}ms ease !important;
            }
            
            .kanban-task-card:hover {
                ${this._hoverConfig.enabled ? `
                    transform: translateY(-${this._hoverConfig.cardElevation}px) scale(${this._hoverConfig.cardScale});
                    box-shadow: ${this.getHoverShadowValue(this._shadowConfig.cardHover, this._shadowConfig.customCardHover)};
                ` : ''}
            }
            
            .task-content {
                line-height: ${this._textConfig.lineHeight} !important;
                text-align: ${this._alignmentConfig.text.toLowerCase()} !important;
                word-break: ${this._textConfig.wordWrap ? 'break-word' : 'normal'} !important;
                ${this._textConfig.enableMultiline ? `
                    white-space: normal !important;
                    display: -webkit-box !important;
                    -webkit-line-clamp: ${this._textConfig.maxLines} !important;
                    -webkit-box-orient: vertical !important;
                    overflow: hidden !important;
                ` : `
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                `}
            }
            
            .task-title {
                font-weight: 600 !important;
                margin-bottom: 4px !important;
                line-height: ${this._textConfig.lineHeight} !important;
                padding-right: ${this._authorConfig.showBadge && this._authorConfig.position === 'Top Right' ? '70px' : '0'} !important;
                white-space: normal !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                display: block !important;
            }
            
            .task-description {
                font-size: ${Math.max(10, this._styleConfig.fontSize - 2)}px !important;
                color: ${this._styleConfig.secondaryTextColor} !important;
                line-height: ${this._textConfig.lineHeight} !important;
            }
            
            .author-badge {
                border-radius: ${this._radiusConfig.badge}px !important;
                box-shadow: ${this.getShadowValue('Subtle', '')} !important;
                transition: all ${this._hoverConfig.transitionDuration}ms ease !important;
            }

            .task-metadata {
                flex-wrap: wrap !important;
                gap: 4px !important;
            }
            
            .author-badge:hover {
                ${this._hoverConfig.enabled ? `
                    transform: scale(1.05);
                    box-shadow: ${this.getHoverShadowValue('Medium', '')};
                ` : ''}
            }
            
            .priority-badge,
            .assignee-badge {
                border-radius: ${Math.max(4, this._radiusConfig.badge / 3)}px !important;
                box-shadow: ${this.getShadowValue('Subtle', '')} !important;
            }
            
            .kanban-column-header {
                border-radius: ${this._radiusConfig.column}px ${this._radiusConfig.column}px 0 0 !important;
            }
            
            .kanban-tasks-container.drag-over {
                background-color: ${this.hexToRgba(this._styleConfig.primaryColor, 0.1)} !important;
                border-color: ${this._styleConfig.primaryColor} !important;
                border-radius: 0 0 ${this._radiusConfig.column}px ${this._radiusConfig.column}px !important;
            }
            
            /* Enhanced hover effects for interactive elements */
            .kanban-task-card[draggable="true"]:active {
                ${this._hoverConfig.enabled ? `
                    transform: scale(0.98);
                    box-shadow: ${this.getShadowValue('Medium', '')};
                ` : ''}
            }
            
            /* Text overflow fade effect */
            .task-content.fade-overflow {
                mask-image: linear-gradient(to bottom, black 70%, transparent 100%) !important;
                -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%) !important;
            }
            
            /* Responsive adjustments */
            /* Scrollbar styling */
            .kanban-board-container::-webkit-scrollbar {
                height: 8px;
                width: 8px;
            }
            .kanban-board-container::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.05);
                border-radius: 4px;
            }
            .kanban-board-container::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
            }
            .kanban-board-container::-webkit-scrollbar-thumb:hover {
                background: rgba(0,0,0,0.3);
            }
            
            .kanban-tasks-container::-webkit-scrollbar {
                width: 6px;
            }
            .kanban-tasks-container::-webkit-scrollbar-thumb {
                background-color: rgba(0,0,0,0.1);
                border-radius: 3px;
            }

            /* Responsive adjustments */
            
            /* Share Popup Styles - Enhanced Fluent UI */
            .kanban-overlay {
                /* Background and opacity handled dynamically in JS */
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: ${this._radiusConfig.board}px;
            }
            .share-btn {
                width: 32px;
                height: 32px;
                background-color: transparent;
                border-radius: 4px; /* Fluent square-ish radius */
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.1s;
                color: #555;
            }
            .share-btn:hover {
                background-color: #f0f0f0; /* Subtle hover */
                color: #333;
            }
            .share-popup {
                background-color: ${this._shareModalConfig.backgroundColor || '#ffffff'} !important;
                border: 1px solid rgba(0,0,0,0.1);
                font-family: '${this._shareModalConfig.fontFamily || 'Segoe UI'}', sans-serif;
                cursor: default;
                text-align: ${this._shareModalConfig.textAlignment?.toLowerCase() || 'left'};
                box-shadow: ${this.getShadowValue(this._shareModalConfig.shadow || 'Medium', '')};
                z-index: 1001;
                /* Ensure no transparency on the box itself */
                opacity: 1 !important;
            }
            .action-btn.secondary {
                background-color: #f3f4f6;
                color: #111827;
                border: 1px solid rgba(0,0,0,0.1);
            }
            .action-btn.secondary:hover {
                background-color: #e5e7eb;
            }
            .share-popup h3 {
                margin: 0;
                font-size: ${(this._shareModalConfig.fontSize || 14) + 2}px;
                font-weight: 600;
                color: ${this._shareModalConfig.headerColor || '#111827'};
                /* Subject truncation logic */
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                max-width: 100% !important;
                display: block !important;
            }
            .share-popup label {
                font-size: ${(this._shareModalConfig.fontSize || 14) - 2}px;
                font-weight: 600;
                color: ${this._shareModalConfig.textColor || '#111827'};
                margin-bottom: 6px;
                display: block;
                opacity: 0.7;
            }
            .share-popup textarea {
                width: 100%;
                height: 100px;
                border: 1px solid rgba(0,0,0,0.15);
                background-color: #fcfcfc;
                border-radius: ${Math.max(0, (this._shareModalConfig.borderRadius || 8) - 4)}px;
                padding: 10px;
                font-family: inherit;
                font-size: ${this._shareModalConfig.fontSize || 14}px;
                color: ${this._shareModalConfig.textColor || '#111827'};
                resize: none;
                outline: none;
                box-sizing: border-box;
            }
            .share-popup textarea:focus {
                border-color: ${this._styleConfig.primaryColor};
                background-color: white;
                box-shadow: 0 0 0 2px ${this.hexToRgba(this._styleConfig.primaryColor, 0.1)};
            }
            .share-methods {
                display: flex;
                gap: 10px;
            }
            .method-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: ${Math.max(0, (this._shareModalConfig.borderRadius || 8) - 2)}px;
                background: white;
                cursor: pointer;
                font-size: ${this._shareModalConfig.fontSize || 14}px;
                color: ${this._shareModalConfig.textColor || '#1f2937'};
                transition: all 0.2s ease;
            }
            .method-btn:hover {
                background-color: #f8f9fa;
                border-color: rgba(0,0,0,0.2);
            }
            .method-btn.active {
                border-color: ${this._styleConfig.primaryColor};
                background-color: ${this.hexToRgba(this._styleConfig.primaryColor, 0.05)};
                color: ${this._styleConfig.primaryColor};
                font-weight: 600;
            }
            .share-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 10px;
            }
            .action-btn {
                padding: 10px 24px;
                border-radius: ${Math.max(0, this._shareModalConfig.borderRadius - 4)}px;
                font-size: ${this._shareModalConfig.fontSize}px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: transform 0.1s, background-color 0.2s;
            }
            .action-btn:active {
                transform: scale(0.97);
            }
            .action-btn.primary {
                background-color: ${this._styleConfig.primaryColor};
                color: white;
                box-shadow: 0 4px 12px ${this.hexToRgba(this._styleConfig.primaryColor, 0.3)};
            }
            .action-btn.primary:hover {
                background-color: ${this._styleConfig.primaryColor};
                filter: brightness(1.1);
            }
            .action-btn.secondary {
                background-color: rgba(0,0,0,0.05);
                color: ${this._styleConfig.textColor};
            }
            .action-btn.secondary:hover {
                background-color: rgba(0,0,0,0.1);
            }

            /* --- 12-ZONE HYPER-GRANULAR RESPONSIVENESS --- */

            /* Zone 1: Ultra Wide (> 1600px) */
            @media (min-width: 1601px) {
                .kanban-column { min-width: 350px !important; }
            }

            /* Zone 2: Super Wide (1440px - 1600px) */
            @media (max-width: 1600px) {
                .kanban-column { min-width: 320px !important; }
            }

            /* Zone 3: Wide Desktop (1366px - 1440px) */
            @media (max-width: 1440px) {
                .kanban-column { min-width: 300px !important; }
            }

            /* Zone 4: Standard Desktop (1280px - 1366px) */
            @media (max-width: 1366px) {
                .kanban-column { min-width: 290px !important; }
            }

            /* Zone 5: Compact Desktop (1200px - 1280px) */
            @media (max-width: 1280px) {
                .kanban-column { min-width: 280px !important; }
            }

            /* Zone 6: Laptop (1024px - 1200px) */
            @media (max-width: 1200px) {
                .kanban-column { min-width: 260px !important; }
                .kanban-board-container { overflow-x: auto !important; }
            }

            /* Zone 7: Tablet Landscape Large (900px - 1024px) */
            @media (max-width: 1024px) {
                .kanban-column { min-width: 250px !important; flex-shrink: 0 !important; }
                .kanban-board-container { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
            }
            
            /* Zone 8: Tablet Landscape Small (768px - 900px) */
            @media (max-width: 900px) {
                .kanban-column { min-width: 240px !important; }
            }

            /* Zone 9: Tablet Portrait (600px - 768px) */
            @media (max-width: 768px) {
                .kanban-column { min-width: 220px !important; }
                /* Still horizontal, but tight. 2-3 columns visible. */
            }

            /* Zone 10: Phablet (480px - 600px) - SWITCH TO VERTICAL STACK */
            @media (max-width: 600px) {
                .kanban-board-wrapper { flex-direction: column !important; align-items: stretch !important; }
                .kanban-board-container { height: auto !important; overflow-y: auto !important; overflow-x: hidden !important; }
                .kanban-column { width: 100% !important; max-width: none !important; min-width: 0 !important; flex: none !important; margin-bottom: 20px !important; }
                .kanban-column-header { padding: 14px !important; }
            }

            /* Zone 11: Mobile Standard (375px - 480px) */
            @media (max-width: 480px) {
                .kanban-column { margin-bottom: 16px !important; }
                .kanban-column-header { padding: 12px !important; }
                .kanban-tasks-container { padding: 10px !important; }
            }

            /* Zone 12: Micro Mobile (< 375px) */
            @media (max-width: 375px) {
                .kanban-column-header { padding: 8px 10px !important; font-size: 0.9em !important; }
                .kanban-task-card { padding: 8px 10px !important; }
                .author-avatar { width: 20px !important; height: 20px !important; }
                .author-badge { transform: scale(0.85); transform-origin: right top; }
            }
            
            /* General Touch Optimizations */
            @media (hover: none) and (pointer: coarse) {
                .kanban-task-card {
                    padding: 12px 16px !important; /* Larger touch area */
                }
                 /* Enhance scrollbars for touch */
                .kanban-board-container::-webkit-scrollbar {
                    width: 4px; /* Thinner on mobile */
                    height: 4px;
                }
            }
                
                .kanban-task-card {
                    border-radius: ${Math.max(4, this._radiusConfig.card - 2)}px !important;
                }
                
                .task-content {
                    font-size: ${Math.max(12, this._styleConfig.fontSize - 1)}px !important;
                    ${this._textConfig.enableMultiline ? `
                        -webkit-line-clamp: ${Math.max(2, this._textConfig.maxLines - 1)} !important;
                    ` : ''}
                }
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .kanban-task-card {
                    border-width: 2px !important;
                }
                
                .task-content {
                    color: ${this._styleConfig.textColor} !important;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .kanban-task-card,
                .kanban-column,
                .author-badge {
                    transition: none !important;
                }
                
                .kanban-task-card:hover,
                .kanban-column:hover,
                .author-badge:hover {
                    transform: none !important;
                }
            }
        `;

        styleElement.textContent = customCSS;
    }

    private setupDragEvents(taskElement: HTMLElement): void {
        taskElement.setAttribute('draggable', 'true'); // Explicit attribute
        taskElement.style.cursor = 'grab';

        taskElement.addEventListener('dragstart', (e) => {
            // Critical: Store ID in class instance to bypass dataTransfer restrictions
            this._draggedElement = taskElement;
            this._draggedTaskId = taskElement.getAttribute('data-task-id');
            this._sourceColumnId = (taskElement.parentElement as HTMLElement).getAttribute('data-column-id');

            taskElement.style.opacity = '0.5';

            // Required for Firefox / some browsers to initiate drag
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this._draggedTaskId || 'dummy'); // Fallback
            }

            // Do NOT stop propagation here immediately, let it bubble to initiate?
            // Actually, stopping propagation is safer to prevent Power Apps from cancelling it.
            e.stopPropagation();
        });

        taskElement.addEventListener('dragend', (e) => {
            taskElement.style.opacity = '1';
            this._draggedElement = null;
            // Do not clear _draggedTaskId immediately if we need it in drop? 
            // Actually drop happens before dragend.
            this._draggedTaskId = null;
            this._sourceColumnId = null;
            e.preventDefault();
            e.stopPropagation();
        });
    }

    private setupDropZone(container: HTMLElement): void {
        // Essential: 'dragover' MUST prevent default to allow dropping
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
            }
            container.style.backgroundColor = this.hexToRgba(this._styleConfig.primaryColor, 0.1);
        });

        container.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.style.backgroundColor = this.hexToRgba(this._styleConfig.primaryColor, 0.1);
        });

        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.style.backgroundColor = '';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.style.backgroundColor = '';

            // Use internal state instead of e.dataTransfer.getData
            const taskId = this._draggedTaskId;
            const sourceCol = this._sourceColumnId;

            // Check if we have valid drag data
            if (!taskId || !sourceCol) {
                console.warn("Drop ignored: No active task ID found in internal state.");
                return;
            }

            const targetColumnId = container.getAttribute('data-column-id');
            if (!targetColumnId) return;

            // Prevent drop in same column if that's desired (optional)
            if (sourceCol === targetColumnId) return;

            console.log(`Dropping Task ${taskId} from ${sourceCol} to ${targetColumnId}`);
            this.moveTask(taskId, sourceCol, targetColumnId);
        });
    }

    public destroy(): void {
        const styleElement = document.getElementById('kanban-custom-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }
}
