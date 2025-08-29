# 🕐 Unified Timestamp System - Single Source of Truth

Big Daddy, here's the **unified timestamp system** - one source of truth for all timestamp formatting!

## 📍 **SINGLE SOURCE OF TRUTH**

**Location**: `hooks/useRecordingAnchor.tsx`

```typescript
const formatRelativeTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
```

## 🎯 **How All Components Use It**

### **✅ Components Using Central Function:**
- `Chat.tsx` → `const { formatRelativeTime } = useRecordingAnchor();`
- `TranscriptDrawer.tsx` → `const { formatRelativeTime } = useRecordingAnchor();`
- `VideoReviewInterface.tsx` → `const formatTime = formatRelativeTime;`
- `VideoTranscriptPlayer.tsx` → `const formatTime = formatRelativeTime;`

### **✅ All Use Same Logic:**
```typescript
// EVERYWHERE: Same MM:SS format
"00:02" → 2 seconds
"01:30" → 90 seconds  
"05:45" → 345 seconds
"12:34" → 754 seconds
```

## 📊 **Timestamp Flow**

```
1. Hume sends message with absolute timestamp
   ↓
2. getRelativeTime() converts to relative seconds
   ↓  
3. formatRelativeTime() converts to MM:SS display
   ↓
4. ALL components use the same MM:SS format
```

## 🚀 **Benefits**

- ✅ **One function** - no duplicate logic
- ✅ **Consistent formatting** - MM:SS everywhere
- ✅ **Easy to maintain** - change one place, updates everywhere
- ✅ **No ambiguity** - single source of truth
- ✅ **Works everywhere** - transcripts, videos, downloads, displays

## 🎯 **Usage Pattern**

```typescript
// Import the hook
const { formatRelativeTime } = useRecordingAnchor();

// Use for any timestamp display
const displayTime = formatRelativeTime(relativeSeconds);
// Result: "03:45"
```

**RULE**: If you need to display a timestamp, use `formatRelativeTime()` from `useRecordingAnchor`. Period. 🎯
