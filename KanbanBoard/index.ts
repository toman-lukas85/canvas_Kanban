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
        showTooltipOnOverflow: true
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
        if (this._context.parameters.tasksData.raw) {
            this.loadData();
            this.renderBoard();
        }
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
        // Use basic properties that are available
        if (this._context.parameters.boardHeight?.raw) {
            // Available property
        }
        if (this._context.parameters.columnWidth?.raw) {
            this._layoutConfig.columnWidth = this._context.parameters.columnWidth.raw;
        }
        // Other properties will be added when manifest is properly regenerated
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
        
        // TODO: After manifest regeneration, uncomment:
        // this._authorConfig.displayFormat = this._context.parameters.authorDisplayFormat?.raw || 'Full Name';
        // this._authorConfig.position = this._context.parameters.authorPosition?.raw || 'Top Right';
        // this._authorConfig.showAvatar = this._context.parameters.showAuthorAvatar?.raw !== false;
        // this._authorConfig.avatarSize = this._context.parameters.authorAvatarSize?.raw || 20;
        // this._authorConfig.badgeColor = this._context.parameters.authorBadgeColor?.raw || '#e0e7ff';
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
        // Fallback to legacy JSON data for now
        if (this._context.parameters.tasksData.raw) {
            this.loadFromLegacyData();
        } else {
            this._boardData = this.getEmptyBoardData();
        }
    }

    private loadFromDataset(): void {
        // Will be implemented when dataset binding is working
        console.log("Dataset loading not yet implemented");
    }

    private loadFromLegacyData(): void {
        try {
            const parsedData = JSON.parse(this._context.parameters.tasksData.raw!);
            this._boardData = { ...this.getEmptyBoardData(), ...parsedData };
        } catch (e) {
            console.warn("Failed to parse tasks data, using empty board");
            this._boardData = this.getEmptyBoardDataWithSamples();
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
                authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
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
                authorEmail: 'mary.johnson@company.com'
                // No avatar - initials will be used
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
                authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612c3c5?w=100&h=100&fit=crop&crop=face'
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
                authorEmail: 'mike.davis@company.com'
                // No avatar - initials with auto color will be used
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
                authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
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
        
        const boardHeight = this._context.parameters.boardHeight?.raw || 600;
        const enableDragDrop = this._context.parameters.enableDragDrop?.raw !== false;

        this._container.innerHTML = '';
        this._container.className = 'kanban-board-container';
        this._container.style.height = `${boardHeight}px`;
        this._container.style.overflow = 'auto';
        this._container.style.fontFamily = this._styleConfig.fontFamily;
        this._container.style.fontSize = `${this._styleConfig.fontSize}px`;
        this._container.style.background = this._styleConfig.backgroundColor;
        this._container.style.color = this._styleConfig.textColor;

        this.applyBoardAlignment(this._container);

        const boardWrapper = document.createElement('div');
        boardWrapper.className = 'kanban-board-wrapper';
        this.applyColumnsAlignment(boardWrapper);

        const totalColumns = this._boardData.columnOrder.length;
        let columnWidth = this._layoutConfig.columnWidth;

        if (columnWidth === 0) {
            const availableWidth = this._container.clientWidth - (this._layoutConfig.columnSpacing * (totalColumns + 1));
            columnWidth = Math.max(
                this._layoutConfig.columnMinWidth,
                Math.min(this._layoutConfig.columnMaxWidth, availableWidth / totalColumns)
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
        columnDiv.style.width = `${width}px`;
        columnDiv.style.minWidth = `${this._layoutConfig.columnMinWidth}px`;
        columnDiv.style.maxWidth = `${this._layoutConfig.columnMaxWidth}px`;
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
        taskDiv.className = 'kanban-task-card';
        taskDiv.style.backgroundColor = this._styleConfig.cardBackgroundColor;
        taskDiv.style.border = `1px solid ${this.hexToRgba(this._styleConfig.primaryColor, 0.2)}`;
        taskDiv.style.borderRadius = `${this._radiusConfig.card}px`;
        taskDiv.style.padding = '12px';
        taskDiv.style.marginBottom = `${this._layoutConfig.cardSpacing}px`;
        taskDiv.style.cursor = enableDragDrop ? 'grab' : 'default';
        taskDiv.style.boxShadow = this.getShadowValue(this._shadowConfig.card, this._shadowConfig.customCard);
        taskDiv.style.transition = `all ${this._hoverConfig.transitionDuration}ms ease`;
        taskDiv.style.fontFamily = this._styleConfig.fontFamily;
        taskDiv.style.position = 'relative';

        // Set task ID for drag operations
        taskDiv.setAttribute('data-task-id', task.id);

        // Add author badge if enabled and position is not inline
        if (this._authorConfig.showBadge && this._authorConfig.position !== 'Inline') {
            const authorBadge = this.createAuthorBadge(task);
            if (authorBadge) {
                taskDiv.appendChild(authorBadge);
            }
        }

        const content = this.createTaskContent(task);
        taskDiv.appendChild(content);

        if (task.priority || task.dueDate || task.assignedTo || (this._authorConfig.showBadge && this._authorConfig.position === 'Inline')) {
            const metadata = this.createTaskMetadata(task);
            taskDiv.appendChild(metadata);
        }

        if (enableDragDrop) {
            this.setupDragEvents(taskDiv);
        }

        return taskDiv;
    }

    private createTaskContent(task: Task): HTMLElement {
        const content = document.createElement('div');
        content.className = 'task-content';
        content.style.fontSize = `${this._styleConfig.fontSize}px`;
        content.style.color = this._styleConfig.textColor;
        content.style.fontFamily = this._styleConfig.fontFamily;
        content.style.marginBottom = '8px';
        
        // Apply text alignment
        content.style.textAlign = this._alignmentConfig.text.toLowerCase() as 'left' | 'center' | 'right' | 'justify';
        
        // Configure multiline text
        if (this._textConfig.enableMultiline) {
            content.style.lineHeight = this._textConfig.lineHeight.toString();
            content.style.wordWrap = this._textConfig.wordWrap ? 'break-word' : 'normal';
            content.style.whiteSpace = 'normal';
            content.style.overflow = 'hidden';
            
            if (this._textConfig.maxLines > 0) {
                content.style.display = '-webkit-box';
                content.style.webkitLineClamp = this._textConfig.maxLines.toString();
                content.style.webkitBoxOrient = 'vertical';
                
                // Add fade effect for overflow
                if (this._textConfig.textOverflow === 'fade') {
                    content.style.maskImage = 'linear-gradient(to bottom, black 70%, transparent 100%)';
                    content.style.webkitMaskImage = 'linear-gradient(to bottom, black 70%, transparent 100%)';
                }
            }
            
            // Add tooltip on overflow if enabled
            if (this._textConfig.showTooltipOnOverflow && task.title && task.title.length > 50) {
                content.title = task.title;
            }
        } else {
            // Single line configuration
            content.style.whiteSpace = 'nowrap';
            content.style.overflow = 'hidden';
            content.style.textOverflow = 'ellipsis';
            
            if (this._textConfig.showTooltipOnOverflow) {
                content.title = task.title;
            }
        }

        // Create text content with proper formatting
        if (task.description && task.description !== task.title) {
            // If there's a separate description, create structured content
            const title = document.createElement('div');
            title.className = 'task-title';
            title.style.fontWeight = '600';
            title.style.marginBottom = '4px';
            title.textContent = task.title;
            
            const description = document.createElement('div');
            description.className = 'task-description';
            description.style.fontSize = `${Math.max(10, this._styleConfig.fontSize - 2)}px`;
            description.style.color = this._styleConfig.secondaryTextColor;
            description.style.lineHeight = this._textConfig.lineHeight.toString();
            description.textContent = task.description;
            
            content.appendChild(title);
            content.appendChild(description);
        } else {
            // Simple title only
            content.textContent = task.title;
        }

        return content;
    }

    private createAuthorBadge(task: Task): HTMLElement | null {
        const authorName = this.formatAuthorName(task);
        if (!authorName) return null;

        const badge = document.createElement('div');
        badge.className = 'author-badge';
        badge.style.position = 'absolute';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '4px';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '12px';
        badge.style.fontSize = `${Math.max(10, this._styleConfig.fontSize - 2)}px`;
        badge.style.fontWeight = '500';
        badge.style.fontFamily = this._styleConfig.fontFamily;
        badge.style.backgroundColor = this._authorConfig.badgeColor;
        badge.style.color = this._styleConfig.textColor;
        badge.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
        badge.style.zIndex = '1';

        // Position the badge
        this.positionAuthorBadge(badge, this._authorConfig.position);

        // Add avatar if enabled and available
        if (this._authorConfig.showAvatar) {
            const avatar = this.createAuthorAvatar(task);
            if (avatar) {
                badge.appendChild(avatar);
            }
        }

        // Add author name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = authorName;
        nameSpan.style.whiteSpace = 'nowrap';
        nameSpan.style.maxWidth = '80px';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.textOverflow = 'ellipsis';
        badge.appendChild(nameSpan);

        return badge;
    }

    private createAuthorAvatar(task: Task): HTMLElement | null {
        const avatarUrl = task.authorAvatar || task.assignedTo;
        if (!avatarUrl) return null;

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

        // If it's a URL, try to load as image
        if (avatarUrl.startsWith('http') || avatarUrl.includes('.')) {
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

            if (task.assignedTo) {
                const assignee = document.createElement('span');
                assignee.textContent = task.assignedTo;
                assignee.style.backgroundColor = this.hexToRgba(this._styleConfig.primaryColor, 0.1);
                assignee.style.color = this._styleConfig.primaryColor;
                assignee.style.padding = '2px 6px';
                assignee.style.borderRadius = '4px';
                details.appendChild(assignee);
            }

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

        this.renderBoard();

        this._lastUpdatedTask = taskId;
        this._pendingUpdate = true;
        this._notifyOutputChanged();
    }

    public getOutputs(): IOutputs {
        const lastMovedTask = this._lastUpdatedTask ? this._boardData.tasks[this._lastUpdatedTask] : null;
        
        return {
            updatedTasksData: JSON.stringify(this._boardData),
            lastMovedTask: lastMovedTask ? JSON.stringify({
                taskId: lastMovedTask.recordId || lastMovedTask.id,
                newStatus: lastMovedTask.status,
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
                font-family: '${this._styleConfig.fontFamily}', sans-serif !important;
                font-size: ${this._styleConfig.fontSize}px !important;
                background-color: ${this._styleConfig.backgroundColor} !important;
                color: ${this._styleConfig.textColor} !important;
                border-radius: ${this._radiusConfig.board}px !important;
                box-shadow: ${this.getShadowValue(this._shadowConfig.board, this._shadowConfig.customBoard)} !important;
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
            @media (max-width: 768px) {
                .kanban-board-container {
                    border-radius: ${Math.max(4, this._radiusConfig.board - 4)}px !important;
                }
                
                .kanban-column {
                    border-radius: ${Math.max(8, this._radiusConfig.column - 4)}px !important;
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
        taskElement.draggable = true;

        taskElement.addEventListener('dragstart', (e) => {
            this._draggedElement = taskElement;
            this._draggedTaskId = taskElement.getAttribute('data-task-id');
            this._sourceColumnId = (taskElement.parentElement as HTMLElement).getAttribute('data-column-id');
            taskElement.style.opacity = '0.5';
            e.dataTransfer!.effectAllowed = 'move';
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.style.opacity = '1';
            this._draggedElement = null;
            this._draggedTaskId = null;
            this._sourceColumnId = null;
        });
    }

    private setupDropZone(container: HTMLElement): void {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
            container.style.backgroundColor = this.hexToRgba(this._styleConfig.primaryColor, 0.1);
        });

        container.addEventListener('dragleave', () => {
            container.style.backgroundColor = '';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.backgroundColor = '';

            if (!this._draggedTaskId || !this._sourceColumnId) return;

            const targetColumnId = container.getAttribute('data-column-id');
            if (!targetColumnId) return;

            this.moveTask(this._draggedTaskId, this._sourceColumnId, targetColumnId);
        });
    }

    public destroy(): void {
        const styleElement = document.getElementById('kanban-custom-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }
}
