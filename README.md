# Kanban Board PCF Component

Tato PCF (PowerApps Component Framework) komponenta implementuje interaktivní Kanban board s drag-and-drop funkcionalitou pro Power Apps Canvas aplikace.

## Funkce

- **Interaktivní Kanban board** s 4 sloupci (Ke zpracování, V řešení, Ke kontrole, Hotovo)
- **Drag & Drop** funkcionalita pro přesouvání úkolů mezi sloupci
- **Priorita úkolů** (nízká, střední, vysoká) s barevným označením
- **Metadata úkolů** včetně termínů a přiřazených osob
- **Responzivní design** přizpůsobený různým velikostem obrazovky
- **Výstupní vlastnosti** pro zachycení změn v Power Apps

## Vlastnosti komponenty

### Vstupní vlastnosti

| Název | Typ | Popis | Povinné |
|-------|-----|-------|---------|
| `tasksData` | Text | JSON string obsahující data úkolů | Ne |
| `columnsData` | Text | JSON string obsahující konfiguraci sloupců | Ne |
| `boardHeight` | Číslo | Výška board v pixelech (výchozí: 600) | Ne |
| `columnWidth` | Číslo | Šířka každého sloupce v pixelech (výchozí: 300) | Ne |
| `enableDragDrop` | Boolean | Zapnout/vypnout drag & drop (výchozí: true) | Ne |

### Výstupní vlastnosti

| Název | Typ | Popis |
|-------|-----|-------|
| `updatedTasksData` | Text | Aktualizovaná data úkolů po změně |
| `lastMovedTask` | Text | Informace o posledním přesunutém úkolu |

## Formát dat

### Struktura úkolu
```json
{
  "id": "task-1",
  "content": "Popis úkolu",
  "status": "todo",
  "priority": "high",
  "dueDate": "Today",
  "assignee": "JD"
}
```

### Struktura dat
```json
{
  "tasks": {
    "task-1": { /* objekt úkolu */ }
  },
  "columns": {
    "todo": {
      "id": "todo",
      "title": "Ke zpracování",
      "taskIds": ["task-1", "task-2"]
    }
  },
  "columnOrder": ["todo", "inprogress", "review", "done"]
}
```

## Instalace do Power Apps

### 1. Sestavení komponenty
```bash
npm install
npm run build
```

### 2. Zabalení pro distribuci
```bash
pac solution init --publisher-name "YourPublisher" --publisher-prefix "prefix"
pac solution add-reference --path ./
pac solution build
```

### 3. Import do Power Apps
1. Otevřte Power Apps Studio
2. Vytvořte nebo otevřete Canvas aplikaci
3. Přejděte na **Insert** > **Get more components**
4. Klikněte na **Import component**
5. Nahrajte .zip soubor s komponentou
6. Komponenta bude dostupná v sekci **Code components**

## Použití v Power Apps

### Základní použití
```
// Vložte komponentu do aplikace
KanbanBoard1.tasksData = JSON(YourDataSource)
KanbanBoard1.boardHeight = 600
KanbanBoard1.enableDragDrop = true
```

### Reakce na změny
```
// Při změně dat komponenty
If(!IsBlank(KanbanBoard1.lastMovedTask),
    // Zpracovat přesunutí úkolu
    Set(varLastMove, JSON(KanbanBoard1.lastMovedTask));
    // Aktualizovat data source
    UpdateIf(YourDataSource, 
        ID = Value(varLastMove.taskId),
        {Status: varLastMove.newStatus}
    )
)
```

## Customizace

### CSS styly
Styly lze upravit v souboru `css/KanbanBoard.css`. Hlavní CSS třídy:
- `.kanban-board-container` - Hlavní kontejner
- `.kanban-column` - Sloupce board
- `.kanban-task-card` - Karty úkolů
- `.priority-high|medium|low` - Prioritní označení

### Rozšíření funkcionality
Komponentu lze rozšířit o:
- Přidání nových úkolů
- Editace úkolů
- Filtrování a vyhledávání
- Různé typy board layoutů

## Troubleshooting

### Běžné problémy

**Drag & Drop nefunguje**
- Zkontrolujte, že `enableDragDrop` je nastaveno na `true`
- Ověřte, že data obsahují správnou strukturu

**Data se nenačítají**
- Zkontrolujte formát JSON ve vlastnosti `tasksData`
- Ověřte, že data obsahují všechny povinné vlastnosti úkolů

**Styling problémy**
- Zkontrolujte, že CSS soubor je správně zahrnut v manifestu
- Ověřte, že nejsou konflikty s existujícími styly aplikace

## Podpora

Pro podporu a hlášení chyb vytvořte issue v projektu nebo kontaktujte vývojáře.

## Licence

Tento projekt je licencován pod MIT licencí.
