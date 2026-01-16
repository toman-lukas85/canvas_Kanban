# Styling a Customizace Kanban Board PCF komponenty

## Nové vlastnosti pro styling

### Typografie

| Vlastnost | Typ | Popis | Možné hodnoty |
|-----------|-----|-------|---------------|
| `fontFamily` | Dropdown | Rodina fontu pro všechen text | Arial, Segoe UI, Helvetica, Times New Roman, Georgia, Verdana, Calibri, Tahoma, Open Sans, Roboto |
| `fontSize` | Číslo | Základní velikost fontu v pixelech | 10-24 px (výchozí: 14) |

### Základní barvy

| Vlastnost | Typ | Popis | Formát |
|-----------|-----|-------|---------|
| `primaryColor` | Color Picker | Hlavní barva pro ohraničení a zvýraznění | #hex (výchozí: #3b82f6) |
| `backgroundColor` | Color Picker | Hlavní barva pozadí boardu | #hex (výchozí: #faf9f8) |
| `columnBackgroundColor` | Color Picker | Barva pozadí sloupců | #hex (výchozí: #f5f7fa) |
| `cardBackgroundColor` | Color Picker | Barva pozadí karet úkolů | #hex (výchozí: #ffffff) |
| `textColor` | Color Picker | Hlavní barva textu | #hex (výchozí: #1f2937) |
| `secondaryTextColor` | Color Picker | Vedlejší barva textu pro metadata | #hex (výchozí: #6b7280) |

### Priority barvy

| Vlastnost | Typ | Popis | Formát |
|-----------|-----|-------|---------|
| `highPriorityColor` | Color Picker | Barva pro vysokou prioritu | #hex (výchozí: #dc2626) |
| `mediumPriorityColor` | Color Picker | Barva pro střední prioritu | #hex (výchozí: #ea580c) |
| `lowPriorityColor` | Color Picker | Barva pro nízkou prioritu | #hex (výchozí: #059669) |

## Použití v Power Apps

### Základní konfigurace stylingu
```powerfx
// Nastavení fontu a velikosti
KanbanBoard1.fontFamily = "Open Sans"
KanbanBoard1.fontSize = 16

// Hlavní barvy
KanbanBoard1.primaryColor = "#6366f1"  // Indigo
KanbanBoard1.backgroundColor = "#f8fafc"
KanbanBoard1.textColor = "#0f172a"
```

### Firemní styling
```powerfx
// Nastavení firemních barev
KanbanBoard1.primaryColor = "#1e3a8a"  // Firemní modrá
KanbanBoard1.columnBackgroundColor = "#f1f5f9"
KanbanBoard1.cardBackgroundColor = "#ffffff"
KanbanBoard1.fontFamily = "Calibri"
KanbanBoard1.fontSize = 14

// Customizace prioritních barev
KanbanBoard1.highPriorityColor = "#dc2626"  // Červená
KanbanBoard1.mediumPriorityColor = "#f59e0b"  // Oranžová  
KanbanBoard1.lowPriorityColor = "#10b981"  // Zelená
```

### Dark mode téma
```powerfx
// Tmavé téma
KanbanBoard1.backgroundColor = "#1f2937"
KanbanBoard1.columnBackgroundColor = "#374151"
KanbanBoard1.cardBackgroundColor = "#4b5563"
KanbanBoard1.textColor = "#f9fafb"
KanbanBoard1.secondaryTextColor = "#d1d5db"
KanbanBoard1.primaryColor = "#60a5fa"
```

### Responsive font sizing
```powerfx
// Dynamické přizpůsobení velikosti fontu podle velikosti obrazovky
KanbanBoard1.fontSize = If(
    App.Width < 768, 12,     // Mobile
    App.Width < 1024, 14,    // Tablet
    16                       // Desktop
)
```

## Pokročilé styling techniky

### Brandování podle oddělení
```powerfx
// Různé barvy podle oddělení uživatele
Switch(
    User().Department,
    "IT", Set(varKanbanColors, {
        primary: "#3b82f6",
        background: "#eff6ff",
        high: "#dc2626"
    }),
    "Marketing", Set(varKanbanColors, {
        primary: "#ec4899", 
        background: "#fdf2f8",
        high: "#be185d"
    }),
    "Sales", Set(varKanbanColors, {
        primary: "#10b981",
        background: "#ecfdf5", 
        high: "#047857"
    }),
    // Default
    Set(varKanbanColors, {
        primary: "#6366f1",
        background: "#f8fafc",
        high: "#dc2626"
    })
);

// Aplikovat barvy
KanbanBoard1.primaryColor = varKanbanColors.primary;
KanbanBoard1.backgroundColor = varKanbanColors.background;
KanbanBoard1.highPriorityColor = varKanbanColors.high;
```

### Podmíněné styling podle dat
```powerfx
// Změnit barvy podle počtu úkolů s vysokou prioritou
With(
    CountRows(Filter(Tasks, Priority = "High")) as HighPriorityCount,
    If(
        HighPriorityCount > 10,
        // Urgentní režim - červené téma
        KanbanBoard1.primaryColor = "#dc2626";
        KanbanBoard1.backgroundColor = "#fef2f2",
        
        HighPriorityCount > 5,
        // Varování - oranžové téma  
        KanbanBoard1.primaryColor = "#ea580c";
        KanbanBoard1.backgroundColor = "#fff7ed",
        
        // Normální - modré téma
        KanbanBoard1.primaryColor = "#3b82f6";
        KanbanBoard1.backgroundColor = "#eff6ff"
    )
)
```

### Animace a přechody
```powerfx
// Timer pro plynulé přechody barev
Timer1.Duration = 2000
Timer1.AutoStart = true
Timer1.OnTimerEnd = 
    Set(varColorIndex, Mod(varColorIndex + 1, 3));
    Switch(
        varColorIndex,
        0, KanbanBoard1.primaryColor = "#3b82f6",
        1, KanbanBoard1.primaryColor = "#10b981", 
        2, KanbanBoard1.primaryColor = "#f59e0b"
    )
```

## Best practices pro styling

### 1. Accessibility (přístupnost)
```powerfx
// Zajistěte dostatečný kontrast
// Minimální kontrast 4.5:1 pro normální text
// Minimální kontrast 3:1 pro velký text

// Dobré kombinace:
// Tmavý text na světlém pozadí: #1f2937 na #ffffff
// Světlý text na tmavém pozadí: #f9fafb na #1f2937
```

### 2. Konzistence s Power Apps tématy
```powerfx
// Využití systémových barev Power Apps
KanbanBoard1.primaryColor = RGBA(
    ColorValue(App.Theme.Colors.Primary).R,
    ColorValue(App.Theme.Colors.Primary).G, 
    ColorValue(App.Theme.Colors.Primary).B,
    1
)
```

### 3. Responsive design
```powerfx
// Přizpůsobení velikostí podle zařízení
KanbanBoard1.columnWidth = If(App.Width < 768, 250, 300)
KanbanBoard1.fontSize = If(App.Width < 768, 12, 14)
```

### 4. Uživatelské preference
```powerfx
// Uložení uživatelských preferencí
// OnChange událost pro color picker:
Patch(
    UserPreferences,
    LookUp(UserPreferences, UserEmail = User().Email),
    {
        KanbanPrimaryColor: ColorPicker1.SelectedColor,
        KanbanFontSize: Slider1.Value,
        KanbanFontFamily: Dropdown1.Selected.Value
    }
)

// Načtení při spuštění:
With(
    LookUp(UserPreferences, UserEmail = User().Email),
    KanbanBoard1.primaryColor = KanbanPrimaryColor;
    KanbanBoard1.fontSize = KanbanFontSize;
    KanbanBoard1.fontFamily = KanbanFontFamily
)
```