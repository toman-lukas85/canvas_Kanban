# Author Badge Configuration Guide

## Přehled funkcí Author Badge

Author Badge umožňuje zobrazovat informace o autorovi/přiřazené osobě přímo na kartách úkolů v Kanban boardu. Podporuje avatary, různé formáty zobrazení jména a flexibilní pozicování.

## Základní konfigurace

### 1. Aktivace Author Badge
```powerfx
// Zapnutí/vypnutí author badge
KanbanBoard1.showAuthorBadge = true

// Zapnutí/vypnutí avatarů
KanbanBoard1.showAuthorAvatar = true

// Velikost avatarů v pixelech
KanbanBoard1.authorAvatarSize = 24

// Barva pozadí badge
KanbanBoard1.authorBadgeColor = "#e0e7ff"
```

### 2. Formáty zobrazení jména
```powerfx
// Možné formáty zobrazení:
KanbanBoard1.authorDisplayFormat = "Full Name"      // Jan Novák
KanbanBoard1.authorDisplayFormat = "First Name Only" // Jan
KanbanBoard1.authorDisplayFormat = "Last Name Only"  // Novák
KanbanBoard1.authorDisplayFormat = "Initials"       // JN
KanbanBoard1.authorDisplayFormat = "Email"          // jan.novak@firma.cz
KanbanBoard1.authorDisplayFormat = "Custom"         // Vlastní formát
```

### 3. Pozicování badge
```powerfx
// Možné pozice na kartě:
KanbanBoard1.authorPosition = "Top Right"     // Pravý horní roh (výchozí)
KanbanBoard1.authorPosition = "Top Left"      // Levý horní roh  
KanbanBoard1.authorPosition = "Bottom Right"  // Pravý dolní roh
KanbanBoard1.authorPosition = "Bottom Left"   // Levý dolní roh
KanbanBoard1.authorPosition = "Inline"        // V metadatech úkolu
```

## Mapování datových polí

### 1. Konfigurace datových polí
```powerfx
// Názvy polí v datech pro informace o autorovi:
KanbanBoard1.authorFirstNameField = "authorFirstName"  // Jméno
KanbanBoard1.authorLastNameField = "authorLastName"    // Příjmení
KanbanBoard1.authorEmailField = "authorEmail"          // Email
KanbanBoard1.authorAvatarField = "authorAvatar"        // URL avataru
```

### 2. Struktura dat pro úkoly
```powerfx
// Příklad datové struktury:
Set(varTaskData, JSON([
    {
        id: "task-1",
        title: "Implementovat API",
        status: "Todo",
        priority: "high",
        authorFirstName: "Jan",
        authorLastName: "Novák", 
        authorEmail: "jan.novak@firma.cz",
        authorAvatar: "https://example.com/avatar.jpg"
    },
    {
        id: "task-2", 
        title: "Opravit bug",
        status: "In Progress",
        priority: "medium",
        authorFirstName: "Marie",
        authorLastName: "Svoboda",
        authorEmail: "marie.svoboda@firma.cz"
        // Bez avataru - použijí se automaticky generované iniciály
    }
]))
```

## Vlastní formátování

### 1. Custom format strings
```powerfx
// Nastavení vlastního formátu:
KanbanBoard1.authorDisplayFormat = "Custom"
KanbanBoard1.customAuthorFormat = "{firstName} {lastName}"

// Dostupné placeholdery:
// {firstName}  - Jméno
// {lastName}   - Příjmení  
// {email}      - Celý email
// {username}   - Část emailu před @
// {initials}   - Automaticky generované iniciály

// Příklady vlastních formátů:
KanbanBoard1.customAuthorFormat = "{firstName} {lastName}"     // Jan Novák
KanbanBoard1.customAuthorFormat = "{lastName}, {firstName}"    // Novák, Jan
KanbanBoard1.customAuthorFormat = "{initials} ({username})"   // JN (jan.novak)
KanbanBoard1.customAuthorFormat = "{firstName} - {email}"     // Jan - jan.novak@firma.cz
```

### 2. Podmíněné formátování
```powerfx
// Různé formáty podle role uživatele:
KanbanBoard1.customAuthorFormat = If(
    User().SecurityRoles in "Manager",
    "{firstName} {lastName}",           // Manageři - celé jméno
    "{initials}"                        // Ostatní - jen iniciály
)

// Různé formáty podle oddělení:
KanbanBoard1.customAuthorFormat = Switch(
    User().Department,
    "IT", "{username}",                 // IT oddělení - username
    "HR", "{firstName} {lastName}",     // HR - celé jméno
    "Sales", "{firstName}",             // Sales - jen jméno
    "{initials}"                        // Výchozí - iniciály
)
```

## Praktické příklady použití

### 1. Firemní prostředí
```powerfx
// Konfigurace pro firemní prostředí:
KanbanBoard1.showAuthorBadge = true
KanbanBoard1.authorDisplayFormat = "Full Name"
KanbanBoard1.authorPosition = "Top Right"
KanbanBoard1.showAuthorAvatar = true
KanbanBoard1.authorAvatarSize = 20
KanbanBoard1.authorBadgeColor = "#f0f9ff"  // Firemní světle modrá

// Mapování na Dataverse/SharePoint pole:
KanbanBoard1.authorFirstNameField = "cr_assigneefirstname"
KanbanBoard1.authorLastNameField = "cr_assigneelastname"
KanbanBoard1.authorEmailField = "cr_assigneeemail"
KanbanBoard1.authorAvatarField = "cr_assigneeavatar"
```

### 2. Projektové řízení
```powerfx
// Pro projektové řízení s týmy:
KanbanBoard1.showAuthorBadge = true
KanbanBoard1.authorDisplayFormat = "Custom"
KanbanBoard1.customAuthorFormat = "{initials}"  // Kompaktní zobrazení
KanbanBoard1.authorPosition = "Top Left"
KanbanBoard1.showAuthorAvatar = true
KanbanBoard1.authorAvatarSize = 16           // Menší avatary
KanbanBoard1.authorBadgeColor = "#ecfdf5"    // Zelená pro týmy
```

### 3. Support system
```powerfx
// Pro support ticketing:
KanbanBoard1.showAuthorBadge = true  
KanbanBoard1.authorDisplayFormat = "First Name Only"  // Jen jméno
KanbanBoard1.authorPosition = "Inline"                // V metadatech
KanbanBoard1.showAuthorAvatar = false                 // Bez avatarů
KanbanBoard1.authorBadgeColor = "#fef3c7"            // Žlutá pro upozornění
```

### 4. Agilní development
```powerfx
// Pro scrum/kanban týmy:
KanbanBoard1.showAuthorBadge = true
KanbanBoard1.authorDisplayFormat = "Custom" 
KanbanBoard1.customAuthorFormat = "{initials}"
KanbanBoard1.authorPosition = "Bottom Right"
KanbanBoard1.showAuthorAvatar = true
KanbanBoard1.authorAvatarSize = 22
KanbanBoard1.authorBadgeColor = "#ede9fe"  // Fialová pro dev týmy
```

## Integrace s daty

### 1. Dataverse konfigurace
```powerfx
// Při použití Dataverse tabulky:
// 1. Vytvořte pole pro author informace:
//    - cr_authorfirstname (Single Line Text)
//    - cr_authorlastname (Single Line Text)  
//    - cr_authoremail (Single Line Text)
//    - cr_authoravatar (Single Line Text - URL)

// 2. Namapujte pole v komponentě:
KanbanBoard1.authorFirstNameField = "cr_authorfirstname"
KanbanBoard1.authorLastNameField = "cr_authorlastname" 
KanbanBoard1.authorEmailField = "cr_authoremail"
KanbanBoard1.authorAvatarField = "cr_authoravatar"

// 3. Automatické plnění při vytváření úkolu:
Patch(
    Tasks,
    Defaults(Tasks),
    {
        cr_title: TextInput1.Text,
        cr_status: "Todo",
        cr_authorfirstname: User().FirstName,
        cr_authorlastname: User().LastName,
        cr_authoremail: User().Email,
        cr_authoravatar: User().Image  // Pokud je k dispozici
    }
)
```

### 2. SharePoint konfigurace
```powerfx
// Pro SharePoint listy:
// 1. Vytvořte sloupce:
//    - AuthorFirstName (Single line of text)
//    - AuthorLastName (Single line of text)
//    - AuthorEmail (Single line of text) 
//    - AuthorAvatar (Single line of text)

// 2. Nebo použijte Person sloupec:
//    - AssignedTo (Person or Group)
//    - Pak extraktujte data v Power Apps:

Set(varAuthorInfo, 
    JSON(SharePointList.AssignedTo).Claims
)

// Mapování Person pole:
KanbanBoard1.authorFirstNameField = "AssignedTo"  // Person field
// Power Apps automaticky extraktuje DisplayName, Email atd.
```

### 3. Externí systémy (Teams, AD)
```powerfx
// Integrace s Microsoft Graph API:
Set(varUserProfile, 
    Office365Users.UserProfile(TaskRecord.AuthorEmail)
)

// Přiřazení avatar URL z Graph:
Patch(
    Tasks,
    TaskRecord,
    {
        AuthorAvatar: varUserProfile.Photo
    }
)

// Automatické načítání z Teams:
Set(varTeamsUser,
    Office365Users.UserProfile(User().Email)
)

KanbanBoard1.authorFirstName = varTeamsUser.GivenName
KanbanBoard1.authorLastName = varTeamsUser.Surname  
KanbanBoard1.authorAvatar = varTeamsUser.Photo
```

## Styling a customizace

### 1. Responzivní design
```powerfx
// Přizpůsobení velikosti podle obrazovky:
KanbanBoard1.authorAvatarSize = If(
    App.Width < 768, 16,    // Mobile - menší
    App.Width < 1200, 20,   // Tablet - střední
    24                      // Desktop - větší
)

// Pozice podle orientace:
KanbanBoard1.authorPosition = If(
    App.Height > App.Width, "Bottom Right",  // Portrait
    "Top Right"                               // Landscape
)
```

### 2. Barevné témata
```powerfx
// Barevné rozlišení podle priority úkolu:
KanbanBoard1.authorBadgeColor = Switch(
    TaskPriority,
    "High", "#fecaca",      // Červená pro vysokou prioritu
    "Medium", "#fed7aa",    // Oranžová pro střední
    "Low", "#d1fae5",      // Zelená pro nízkou
    "#e0e7ff"              // Výchozí modrá
)

// Podle oddělení:
KanbanBoard1.authorBadgeColor = Switch(
    AuthorDepartment,
    "IT", "#dbeafe",        // Modrá pro IT
    "Marketing", "#fce7f3", // Růžová pro Marketing  
    "Sales", "#d1fae5",     // Zelená pro Sales
    "#f3f4f6"              // Šedá výchozí
)
```

### 3. Animace a efekty
```powerfx
// CSS třídy pro animace jsou automaticky přidány:
// .author-badge.newly-added - pro nově přidané badge
// .author-badge:hover - hover efekt

// Můžete přidat vlastní CSS přes HTML text control:
"<style>
    .author-badge {
        transition: all 0.3s ease !important;
    }
    .author-badge:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
    }
</style>"
```

## Troubleshooting

### 1. Badge se nezobrazuje
```powerfx
// Zkontrolujte:
// 1. Zda je zapnuté zobrazení:
KanbanBoard1.showAuthorBadge = true

// 2. Zda jsou k dispozici autor data:
If(IsBlank(TaskRecord.AuthorFirstName) && IsBlank(TaskRecord.AuthorEmail),
    Notify("Chybí informace o autorovi", NotificationType.Warning)
)

// 3. Správné mapování polí:
KanbanBoard1.authorFirstNameField = "správný_název_pole"
```

### 2. Avatary se nenačítají
```powerfx
// Zkontrolujte URL formát:
If(!IsBlank(AvatarURL) && !(StartsWith(AvatarURL, "http")),
    Notify("Avatar URL musí začínat http/https", NotificationType.Error)
)

// Fallback na iniciály:
If(IsError(LoadImage(AvatarURL)),
    // Komponenta automaticky přepne na iniciály
    Set(varShowInitials, true)
)
```

### 3. Performance optimalizace
```powerfx
// Pro velké datasety omezit avatar loading:
KanbanBoard1.showAuthorAvatar = If(
    CountRows(Tasks) > 100, false,  // Vypnout pro >100 úkolů
    true
)

// Cache author informací:
Set(varAuthorsCache, 
    GroupBy(Tasks, "AuthorEmail", "AuthorInfo")
)
```