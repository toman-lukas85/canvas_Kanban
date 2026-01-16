# Power Apps Integration Guide

## Nastavení tabulky úkolů (Dataverse)

### 1. Vytvoření tabulky úkolů
```
Název tabulky: "Task Management" 
Logický název: cr_taskmanagement
Sloupce:
- cr_title (Single Line of Text, Required) - Název úkolu
- cr_status (Choice) - Stav úkolu 
  - Todo (Value: 1)
  - In Progress (Value: 2) 
  - Review (Value: 3)
  - Done (Value: 4)
- cr_priority (Choice) - Priorita
  - Low (Value: 1)
  - Medium (Value: 2)
  - High (Value: 3)
- cr_assignedto (Single Line of Text) - Přiřazeno komu
- cr_duedate (Date Only) - Termín dokončení
- cr_description (Multiple Lines of Text) - Popis úkolu
```

### 2. SharePoint List alternativa
```
Název seznamu: "Kanban Tasks"
Sloupce:
- Title (Single Line of Text) - Název úkolu
- Status (Choice: Todo, In Progress, Review, Done)
- Priority (Choice: Low, Medium, High)  
- AssignedTo (Person or Group)
- DueDate (Date)
- Description (Multiple lines of text)
```

## Integrace do Canvas App

### 1. Přidání komponenty
```powerfx
// V Canvas App - vložte komponentu
KanbanBoard1.taskDataSet = Filter(Tasks, Status <> "Archived")
KanbanBoard1.todoStatus = "Todo"
KanbanBoard1.inProgressStatus = "In Progress" 
KanbanBoard1.reviewStatus = "Review"
KanbanBoard1.doneStatus = "Done"
KanbanBoard1.enableDragDrop = true
```

### 2. Automatické updaty při přesunu
```powerfx
// OnChange property komponenty KanbanBoard1:
If(
    !IsBlank(KanbanBoard1.lastMovedTask),
    With(
        JSON(KanbanBoard1.lastMovedTask),
        Patch(
            Tasks,
            LookUp(Tasks, ID = Value(taskId)),
            {Status: newStatus}
        )
    );
    // Zobrazit notifikaci
    Notify("Úkol '" & JSON(KanbanBoard1.lastMovedTask).title & "' přesunut", NotificationType.Success)
)
```

### 3. Handling chyb a retry logiky
```powerfx
// Komplexnější OnChange s error handlingem:
If(
    !IsBlank(KanbanBoard1.lastMovedTask),
    With(
        JSON(KanbanBoard1.lastMovedTask),
        Set(
            varUpdateResult,
            IfError(
                Patch(
                    Tasks,
                    LookUp(Tasks, ID = Value(taskId)),
                    {Status: newStatus}
                ),
                {
                    IsError: true,
                    ErrorKind: FirstError.Kind,
                    ErrorMessage: FirstError.Message
                }
            )
        );
        If(
            varUpdateResult.IsError,
            // Zobrazit chybu a obnovit board
            Notify("Chyba při aktualizaci: " & varUpdateResult.ErrorMessage, NotificationType.Error);
            Reset(KanbanBoard1),
            // Úspěch
            Notify("Úkol '" & title & "' úspěšně přesunut", NotificationType.Success)
        )
    )
)
```

## Pokročilé funkce

### 1. Přidání nových úkolů
```powerfx
// Button OnSelect pro přidání úkolu:
Patch(
    Tasks,
    Defaults(Tasks),
    {
        cr_title: TextInput1.Text,
        cr_status: "Todo",
        cr_priority: Dropdown1.Selected.Value,
        cr_assignedto: ComboBox1.Selected.DisplayName,
        cr_duedate: DatePicker1.SelectedDate
    }
);
Refresh(Tasks);
Reset(TextInput1);
Reset(Dropdown1);
Reset(ComboBox1);
Reset(DatePicker1);
```

### 2. Real-time aktualizace
```powerfx
// Timer control pro automatické obnovení dat:
Timer1.Duration = 30000  // 30 sekund
Timer1.Repeat = true
Timer1.OnTimerEnd = Refresh(Tasks)
```

### 3. Filtrování a vyhledávání
```powerfx
// Search functionality:
KanbanBoard1.taskDataSet = 
    If(
        IsBlank(TextSearchBox.Text),
        Filter(Tasks, Status in ["Todo", "In Progress", "Review", "Done"]),
        Filter(
            Tasks,
            cr_title in TextSearchBox.Text || 
            cr_assignedto in TextSearchBox.Text,
            Status in ["Todo", "In Progress", "Review", "Done"]
        )
    )
```

### 4. Batch operace
```powerfx
// Označit více úkolů jako hotové:
ForAll(
    Filter(Tasks, Selected = true),
    Patch(Tasks, ThisRecord, {Status: "Done"})
);
Refresh(Tasks);
```

## Optimalizace výkonu

### 1. Delegation-friendly queries
```powerfx
// Místo:
Filter(Tasks, cr_assignedto = User().Email && Status <> "Done")

// Použijte:
Filter(Tasks, cr_assignedto = User().Email) // pak další filtry v komponentě
```

### 2. Caching strategíe
```powerfx
// OnStart aplikace - načtení a cache dat:
Set(varTasksCache, Tasks);
Set(varLastRefresh, Now());

// Periodické obnovení cache:
If(
    DateDiff(varLastRefresh, Now(), Minutes) > 5,
    Set(varTasksCache, Tasks);
    Set(varLastRefresh, Now())
);
```

### 3. Optimized data loading
```powerfx
// Načítání pouze potřebných sloupců:
KanbanBoard1.taskDataSet = 
    ShowColumns(
        Tasks,
        "ID",
        "cr_title", 
        "cr_status",
        "cr_priority",
        "cr_assignedto",
        "cr_duedate"
    )
```

## Troubleshooting

### Běžné problémy a řešení

**1. Drag & Drop nefunguje po update**
```powerfx
// Reset komponenty po změně dat:
If(varDataChanged, Reset(KanbanBoard1); Set(varDataChanged, false))
```

**2. Performance problémy s velkými datasety**
```powerfx
// Pagination/virtualization:
KanbanBoard1.taskDataSet = FirstN(SortByColumns(Tasks, "CreatedOn", Descending), 100)
```

**3. Chyby při aktualizaci statusu**
```powerfx
// Retry logika:
If(
    !IsBlank(KanbanBoard1.lastMovedTask),
    Set(varRetryCount, 0);
    While(
        varRetryCount < 3 && IsError(
            Patch(Tasks, LookUp(Tasks, ID = Value(JSON(KanbanBoard1.lastMovedTask).taskId)), {Status: JSON(KanbanBoard1.lastMovedTask).newStatus})
        ),
        Set(varRetryCount, varRetryCount + 1);
        Wait(varRetryCount * 1000)
    )
)
```

## Bezpečnostní aspekty

### 1. Row-level security
```powerfx
// Zobrazovat pouze úkoly přiřazené uživateli nebo jeho týmu:
KanbanBoard1.taskDataSet = 
    Filter(
        Tasks,
        cr_assignedto = User().Email ||
        cr_teamid in varUserTeams
    )
```

### 2. Update permissions
```powerfx
// Kontrola oprávnění před update:
If(
    !IsBlank(KanbanBoard1.lastMovedTask) &&
    (User().Email = JSON(KanbanBoard1.lastMovedTask).assignedTo ||
     "TaskManager" in User().SecurityRoles),
    Patch(...), // Provést update
    Notify("Nemáte oprávnění upravit tento úkol", NotificationType.Warning)
)
```