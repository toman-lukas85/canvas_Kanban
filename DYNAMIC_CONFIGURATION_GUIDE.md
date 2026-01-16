# Dynamická konfigurace Kanban Board PCF komponenty

## Flexibilní konfigurace sloupců

### 1. Quick Column Setup (Jednoduchá konfigurace)
```powerfx
// Různé formáty pro rychlé nastavení sloupců:

// Formát s hranatými závorkami:
KanbanBoard1.quickColumnSetup = "[Otevřeno,V procesu,Uzavřeno]"

// Formát s pipe symbolem:
KanbanBoard1.quickColumnSetup = "New|Active|Completed|Archived"

// Formát s čárkami:
KanbanBoard1.quickColumnSetup = "Todo,In Progress,Review,Done"

// Pro obchodní případy:
KanbanBoard1.quickColumnSetup = "Lead|Opportunity|Proposal|Closed Won|Closed Lost"

// Pro projektové řízení:
KanbanBoard1.quickColumnSetup = "Backlog,Sprint Planning,Development,Testing,Deployment"
```

### 2. Advanced Column Configuration (Pokročilá konfigurace)
```powerfx
// JSON konfigurace s mapováním více statusů na jeden sloupec:
KanbanBoard1.columnDefinitions = JSON([
    {
        id: "new_leads",
        title: "Nové příležitosti", 
        statusValues: ["New", "Open", "Received"]
    },
    {
        id: "qualifying",
        title: "Kvalifikace",
        statusValues: ["Qualifying", "Contacted", "Meeting Scheduled"]
    },
    {
        id: "proposal",
        title: "Návrh",
        statusValues: ["Proposal", "Quote Sent", "Negotiation"]
    },
    {
        id: "won",
        title: "Vyhráno",
        statusValues: ["Won", "Closed Won", "Completed"]
    },
    {
        id: "lost",
        title: "Prohráno", 
        statusValues: ["Lost", "Closed Lost", "Cancelled"]
    }
])
```

## Alignment a Layout možnosti

### 1. Board Alignment (Zarovnání celého board)
```powerfx
// Horizontální zarovnání celého board:
KanbanBoard1.boardHorizontalAlignment = "Center"  // Left, Center, Right, Stretch
```

### 2. Columns Alignment (Zarovnání sloupců)
```powerfx
// Zarovnání sloupců v rámci board:
KanbanBoard1.columnsHorizontalAlignment = "Center"  // Left, Center, Right, Stretch

// Flexibilní šířka sloupců:
KanbanBoard1.columnWidth = 0              // Auto-width podle dostupného místa
KanbanBoard1.columnMinWidth = 200         // Minimální šířka
KanbanBoard1.columnMaxWidth = 400         // Maximální šířka
KanbanBoard1.columnSpacing = 20           // Mezery mezi sloupci
```

### 3. Cards Alignment (Zarovnání karet)
```powerfx
// Vertikální zarovnání karet v rámci sloupců:
KanbanBoard1.cardsVerticalAlignment = "Top"     // Top, Middle, Bottom, Stretch
KanbanBoard1.cardSpacing = 12                   // Mezery mezi kartami

// Zarovnání textu v kartách:
KanbanBoard1.textAlignment = "Center"           // Left, Center, Right, Justify
```

## Styling a barvy

### 1. Základní styling
```powerfx
// Font a typografie:
KanbanBoard1.fontFamily = "Open Sans"
KanbanBoard1.fontSize = 16

// Základní barvy:
KanbanBoard1.primaryColor = "#6366f1"           // Indigo
KanbanBoard1.backgroundColor = "#f8fafc"        // Světle šedá
KanbanBoard1.textColor = "#0f172a"              // Tmavě modrá
```

### 2. Column-specific colors (Barvy pro konkrétní sloupce)
```powerfx
// Různé barvy pro různé sloupce:
KanbanBoard1.columnColors = JSON({
    "new_leads": "#dbeafe",        // Světle modrá
    "qualifying": "#fef3c7",       // Světle žlutá
    "proposal": "#fed7aa",         // Světle oranžová
    "won": "#d1fae5",             // Světle zelená
    "lost": "#fecaca"             // Světle červená
})
```

## Praktické příklady použití

### 1. CRM Sales Pipeline
```powerfx
// Konfigurace pro sales pipeline:
KanbanBoard1.quickColumnSetup = "Lead|Qualified|Proposal|Negotiation|Closed Won|Closed Lost"
KanbanBoard1.columnColors = JSON({
    "col_0": "#e0f2fe",   // Lead - světle modrá
    "col_1": "#fff3e0",   // Qualified - světle oranžová
    "col_2": "#f3e5f5",   // Proposal - světle fialová
    "col_3": "#fff8e1",   // Negotiation - světle žlutá
    "col_4": "#e8f5e8",   // Closed Won - světle zelená
    "col_5": "#ffebee"    // Closed Lost - světle červená
})

// Automatický update při přesunu:
If(
    !IsBlank(KanbanBoard1.lastMovedTask),
    With(
        JSON(KanbanBoard1.lastMovedTask),
        Patch(
            Opportunities,
            LookUp(Opportunities, ID = Value(taskId)),
            {Stage: newStatus}
        )
    )
)
```

### 2. Project Management
```powerfx
// Konfigurace pro projektové řízení:
KanbanBoard1.columnDefinitions = JSON([
    {
        id: "backlog",
        title: "Backlog",
        statusValues: ["Backlog", "New", "Planned"]
    },
    {
        id: "active",
        title: "Aktivní úkoly",
        statusValues: ["Active", "In Progress", "Development"]
    },
    {
        id: "review",
        title: "Code Review",
        statusValues: ["Review", "Testing", "QA"]
    },
    {
        id: "done",
        title: "Hotovo",
        statusValues: ["Done", "Completed", "Deployed"]
    }
])

// Layout optimalizovaný pro širší obrazovky:
KanbanBoard1.columnWidth = 350
KanbanBoard1.columnsHorizontalAlignment = "Center"
KanbanBoard1.boardHeight = 800
```

### 3. Support Ticketing System
```powerfx
// Konfigurace pro support systém:
KanbanBoard1.quickColumnSetup = "New|Assigned|In Progress|Waiting Customer|Resolved"

// Barevné kódování podle priority:
KanbanBoard1.highPriorityColor = "#dc2626"      // Urgentní - červená
KanbanBoard1.mediumPriorityColor = "#f59e0b"    // Střední - oranžová
KanbanBoard1.lowPriorityColor = "#10b981"       // Nízká - zelená

// Kompaktní layout:
KanbanBoard1.columnWidth = 280
KanbanBoard1.cardSpacing = 6
KanbanBoard1.fontSize = 13
```

### 4. Manufacturing Process
```powerfx
// Konfigurace pro výrobní proces:
KanbanBoard1.columnDefinitions = JSON([
    {
        id: "planning",
        title: "Plánování",
        statusValues: ["Planning", "Scheduled", "Ready"]
    },
    {
        id: "production",
        title: "Výroba",
        statusValues: ["Production", "Manufacturing", "Assembly"]
    },
    {
        id: "quality",
        title: "Kontrola kvality",
        statusValues: ["QC", "Testing", "Inspection"]
    },
    {
        id: "shipping",
        title: "Expedice",
        statusValues: ["Shipping", "Packed", "Dispatched"]
    }
])

// Centrované zarovnání pro velké obrazovky:
KanbanBoard1.boardHorizontalAlignment = "Center"
KanbanBoard1.columnsHorizontalAlignment = "Center"
KanbanBoard1.cardsVerticalAlignment = "Top"
```

## Responsive design

### 1. Přizpůsobení velikosti obrazovky
```powerfx
// Dynamické přizpůsobení podle velikosti:
KanbanBoard1.columnWidth = If(
    App.Width < 768, 250,         // Mobile
    App.Width < 1200, 300,        // Tablet
    350                           // Desktop
)

KanbanBoard1.fontSize = If(
    App.Width < 768, 12,          // Mobile
    App.Width < 1200, 14,         // Tablet  
    16                            // Desktop
)

KanbanBoard1.columnsHorizontalAlignment = If(
    App.Width < 768, "Left",      // Mobile - scroll horizontálně
    "Center"                      // Tablet/Desktop - centrovat
)
```

### 2. Orientace zařízení
```powerfx
// Přizpůsobení podle orientace:
KanbanBoard1.boardHeight = If(
    App.Height > App.Width, 500,  // Výška (portrait)
    700                           // Šířka (landscape)
)
```

## Advanced Features

### 1. Conditional Styling
```powerfx
// Změna barev podle stavu dat:
With(
    CountRows(Filter(Tasks, Priority = "High" && Status <> "Done")) as HighPriorityCount,
    
    If(
        HighPriorityCount > 5,
        // Urgentní režim - červené téma
        Set(varKanbanTheme, {
            primary: "#dc2626",
            background: "#fef2f2",
            text: "#7f1d1d"
        }),
        
        HighPriorityCount > 2,  
        // Varování - oranžové téma
        Set(varKanbanTheme, {
            primary: "#ea580c", 
            background: "#fff7ed",
            text: "#9a3412"
        }),
        
        // Normální - modré téma
        Set(varKanbanTheme, {
            primary: "#3b82f6",
            background: "#eff6ff", 
            text: "#1e3a8a"
        })
    );
    
    // Aplikovat téma:
    KanbanBoard1.primaryColor = varKanbanTheme.primary;
    KanbanBoard1.backgroundColor = varKanbanTheme.background;
    KanbanBoard1.textColor = varKanbanTheme.text
)
```

### 2. User Preferences
```powerfx
// Uložení uživatelských preferencí:
Patch(
    UserSettings,
    LookUp(UserSettings, UserEmail = User().Email),
    {
        KanbanLayout: JSON({
            columnWidth: KanbanBoard1.columnWidth,
            fontSize: KanbanBoard1.fontSize,
            alignment: KanbanBoard1.columnsHorizontalAlignment,
            primaryColor: KanbanBoard1.primaryColor
        })
    }
)

// Načtení preferencí při startu:
With(
    LookUp(UserSettings, UserEmail = User().Email).KanbanLayout,
    If(
        !IsBlank(ThisRecord),
        With(
            JSON(ThisRecord),
            KanbanBoard1.columnWidth = columnWidth;
            KanbanBoard1.fontSize = fontSize;
            KanbanBoard1.columnsHorizontalAlignment = alignment;
            KanbanBoard1.primaryColor = primaryColor
        )
    )
)
```

## Troubleshooting

### 1. Column Configuration Issues
```powerfx
// Ověření konfigurace sloupců:
If(
    IsBlank(KanbanBoard1.columnConfiguration),
    Notify("Chyba v konfiguraci sloupců, používám výchozí nastavení", NotificationType.Warning),
    Set(varColumnConfig, JSON(KanbanBoard1.columnConfiguration))
)
```

### 2. Performance s velkými datasety
```powerfx
// Optimalizace pro velké množství dat:
KanbanBoard1.taskDataSet = 
    FirstN(
        SortByColumns(
            Filter(Tasks, Status in ["New","Active","Review","Done"]),
            "ModifiedOn", 
            Descending
        ),
        200  // Limit na 200 nejnovějších záznamů
    )
```