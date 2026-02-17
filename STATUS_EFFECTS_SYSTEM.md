# 🎮 Status Effects System - Complete Guide

ระบบ Status Effects แบบครบวงจร สำหรับเกม Axie Clone RPG

---

## 📋 ภาพรวมระบบ

ระบบนี้ประกอบด้วย 3 ส่วนหลัก:

### 1. 🎨 **Status Effects Manager** (UI สำหรับ Admin)
- สร้าง/แก้ไข/ลบ Status Effects
- กำหนด Logic การทำงาน
- Export/Import JSON
- ตัวอย่างแบบ Real-time

### 2. ⚙️ **Status Effects Engine** (Logic การคำนวณ)
- ประมวลผล Effects ในแต่ละรอบ
- คำนวณดาเมจ/การรักษา/Stat Modifiers
- จัดการ Stacking และ Duration
- ตรวจสอบ Control Effects

### 3. 💾 **Status Effects Data** (ข้อมูล)
- เก็บใน `gameData.js`
- 18 Effects พื้นฐาน
- สามารถเพิ่มได้ไม่จำกัด

---

## 🔧 วิธีการทำงาน

### ขั้นตอนที่ 1: Admin สร้าง Status Effect

```javascript
// Admin เปิด Admin Panel → ✨ Status Effects → ➕ สร้าง Effect ใหม่

const newEffect = {
    // ข้อมูลพื้นฐาน
    id: 'poison_strong',
    name: 'พิษรุนแรง',
    emoji: '🧪',
    color: '#9c27b0',
    description: 'สูญเสีย HP ทุกรอบ',
    effect: 'ลด HP 10% ต่อรอบ เป็นเวลา 3 รอบ',
    displayType: 'icon',
    
    // Logic Configuration
    logic: {
        effectType: 'damage_over_time',  // ประเภท
        duration: 3,                      // ระยะเวลา (รอบ)
        value: 10,                        // ค่าที่ส่งผล
        percentage: true,                 // ใช้ %
        stackable: true,                  // ซ้อนทับได้
        maxStacks: 3,                     // ซ้อนสูงสุด
        triggerTiming: 'turn_start',      // เวลาที่เกิดผล
        targetStat: 'hp',                 // สถานะที่ได้รับผล
        modifierType: 'add'               // วิธีการปรับค่า
    }
};
```

### ขั้นตอนที่ 2: ระบบบันทึกและ Export

```javascript
// ระบบจะบันทึกลง gameData.js
export const STATUS_EFFECTS = {
    poison_strong: {
        id: 'poison_strong',
        name: 'พิษรุนแรง',
        // ... ข้อมูลทั้งหมด
    }
};

// หรือ Export เป็น JSON
{
    "poison_strong": { ... }
}
```

### ขั้นตอนที่ 3: ใช้งานในเกม

```javascript
import { applyStatusEffect, processStatusEffects } from './statusEffectsEngine';
import { STATUS_EFFECTS } from './gameData';

// เมื่อสกิลโจมตี
const poisonEffect = STATUS_EFFECTS.poison_strong;
const result = applyStatusEffect(targetCharacter, poisonEffect, casterCharacter);
console.log(result.message); // "🧪 ไฟร์ดราก้อน ได้รับ พิษรุนแรง!"

// ทุกรอบของเกม
const turnResults = processStatusEffects(
    character, 
    character.activeEffects, 
    'turn_start'
);
console.log(turnResults.damageDealt);  // 45 (10% ของ 450 HP)
console.log(turnResults.messages);     // ["🧪 พิษรุนแรง: -45 HP"]
```

---

## 📊 ประเภท Effect Types

### 1. 🩸 Damage Over Time (DoT)
```javascript
{
    effectType: 'damage_over_time',
    duration: 3,        // 3 รอบ
    value: 10,          // 10% หรือ 10 HP
    percentage: true,   // ใช้ %
    triggerTiming: 'turn_start'
}
```
**ตัวอย่าง:** พิษ, ไหม้, เลือดไหล

### 2. 📈 Stat Modifier
```javascript
{
    effectType: 'stat_modifier',
    targetStat: 'attack',    // hp, attack, defense, speed
    modifierType: 'add',     // add, multiply, set
    value: 30,               // +30% หรือ +30
    percentage: true,
    duration: 3
}
```
**ตัวอย่าง:** Buff ATK, Debuff DEF, เพิ่มความเร็ว

### 3. 🎮 Control
```javascript
{
    effectType: 'control',
    duration: 1,
    triggerTiming: 'turn_start'
}
```
**ตัวอย่าง:** สตัน, แช่แข็ง, ยั่วยุ

### 4. ⚡ Instant
```javascript
{
    effectType: 'instant',
    value: 100,
    triggerTiming: 'on_hit'
}
```
**ตัวอย่าง:** ทำลายโล่, ชำระล้าง, ดูดเลือด

### 5. 🛡️ Passive
```javascript
{
    effectType: 'passive',
    targetStat: 'defense',
    value: 20,
    percentage: true,
    triggerTiming: 'continuous'
}
```
**ตัวอย่าง:** สะท้อนดาเมจ, ภูมิคุ้มกัน, ฟื้นคืนชีพ

### 6. 🛡️ Shield
```javascript
{
    effectType: 'shield',
    value: 100,
    duration: 2
}
```
**ตัวอย่าง:** โล่พลังงาน, กำแพงน้ำแข็ง

### 7. 💚 Heal
```javascript
{
    effectType: 'heal',
    value: 15,
    percentage: true,
    triggerTiming: 'turn_end'
}
```
**ตัวอย่าง:** รักษาต่อเนื่อง, ฟื้นฟูทันที

---

## 🎯 Trigger Timing (เวลาที่เกิดผล)

| Timing | คำอธิบาย | ตัวอย่าง |
|--------|----------|----------|
| `turn_start` | ต้นรอบ | DoT, Heal over Time |
| `turn_end` | ปลายรอบ | Regeneration |
| `on_hit` | เมื่อโจมตี | Lifesteal, Burn on Hit |
| `on_damaged` | เมื่อถูกโจมตี | Reflect, Thorns |
| `continuous` | ต่อเนื่อง | Passive Buffs |

---

## 💡 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: สร้าง "พิษรุนแรง"

```javascript
// 1. Admin สร้างใน Status Effects Manager
{
    id: 'poison_strong',
    name: 'พิษรุนแรง',
    emoji: '🧪',
    logic: {
        effectType: 'damage_over_time',
        duration: 3,
        value: 10,
        percentage: true,
        stackable: true,
        maxStacks: 3
    }
}

// 2. ใช้ในสกิล
const skill = {
    name: 'ลูกพิษ',
    damage: 80,
    statusEffect: 'poison_strong'  // ← เพิ่ม effect
};

// 3. เมื่อใช้สกิล
function useSkill(caster, target, skill) {
    // สร้างดาเมจ
    target.hp -= skill.damage;
    
    // ใส่ status effect
    if (skill.statusEffect) {
        const effect = STATUS_EFFECTS[skill.statusEffect];
        applyStatusEffect(target, effect, caster);
    }
}

// 4. ทุกรอบ
function processTurn(character) {
    const results = processStatusEffects(
        character,
        character.activeEffects,
        'turn_start'
    );
    
    // ลด HP จาก DoT
    character.hp -= results.damageDealt;
    
    // แสดงข้อความ
    results.messages.forEach(msg => console.log(msg));
    
    // ลบ effects ที่หมดอายุ
    removeExpiredEffects(character);
}
```

### ตัวอย่างที่ 2: สร้าง "Buff ATK 50%"

```javascript
// 1. สร้างใน Manager
{
    id: 'rage_mode',
    name: 'โหมดโกรธ',
    emoji: '😡⚔️',
    logic: {
        effectType: 'stat_modifier',
        targetStat: 'attack',
        modifierType: 'add',
        value: 50,
        percentage: true,
        duration: 3
    }
}

// 2. คำนวณค่าสถานะสุดท้าย
const finalStats = calculateFinalStats(character);
console.log(finalStats.attack);  // 70 * 1.5 = 105
```

### ตัวอย่างที่ 3: สร้าง "สตัน 1 รอบ"

```javascript
// 1. สร้างใน Manager
{
    id: 'stun',
    name: 'สตัน',
    emoji: '💫',
    logic: {
        effectType: 'control',
        duration: 1
    }
}

// 2. ตรวจสอบก่อนกระทำ
if (!canAct(character)) {
    console.log('ตัวละครถูกสตัน ไม่สามารถกระทำได้!');
    return;
}
```

---

## 🔄 Flow การทำงานในเกม

```
1. เริ่มรอบ (Turn Start)
   ↓
2. ประมวลผล Status Effects (turn_start)
   - DoT สร้างดาเมจ
   - Heal ฟื้นฟู HP
   - ลดระยะเวลา
   ↓
3. ตรวจสอบ Control Effects
   - ถ้าถูก Stun → ข้ามรอบ
   - ถ้าถูก Taunt → บังคับเป้าหมาย
   ↓
4. เลือกการ์ดและใช้สกิล
   - คำนวณดาเมจ (พิจารณา Stat Modifiers)
   - ใส่ Status Effects ใหม่
   - ตรวจสอบ Reflect, Lifesteal
   ↓
5. ประมวลผล Status Effects (turn_end)
   - Regeneration
   - End of Turn Effects
   ↓
6. ลบ Effects ที่หมดอายุ
   ↓
7. จบรอบ
```

---

## 📝 API Reference

### `applyStatusEffect(character, effect, caster)`
ใส่ Status Effect ให้กับตัวละคร

**Parameters:**
- `character` - ตัวละครที่จะได้รับ effect
- `effect` - Effect object จาก STATUS_EFFECTS
- `caster` - ตัวละครที่ใช้ effect

**Returns:**
```javascript
{
    success: true,
    message: "🧪 ไฟร์ดราก้อน ได้รับ พิษ!"
}
```

### `processStatusEffects(character, activeEffects, timing)`
ประมวลผล Effects ในรอบนั้น

**Parameters:**
- `character` - ตัวละคร
- `activeEffects` - Array ของ effects ที่กำลังทำงาน
- `timing` - 'turn_start', 'turn_end', 'on_hit', 'on_damaged'

**Returns:**
```javascript
{
    damageDealt: 45,
    healingDone: 0,
    statModifiers: { attack: 30 },
    effectsExpired: ['poison'],
    effectsTriggered: ['poison', 'buff_atk'],
    messages: ['🧪 พิษ: -45 HP', '⚔️✨ เพิ่มพลังโจมตี: +30 ATK']
}
```

### `calculateFinalStats(character)`
คำนวณค่าสถานะสุดท้าย (รวม modifiers)

**Returns:**
```javascript
{
    hp: 450,
    maxHp: 450,
    attack: 105,  // 70 + 50% buff
    defense: 0,
    speed: 40,
    shield: 60
}
```

### `canAct(character)`
ตรวจสอบว่าตัวละครสามารถกระทำได้หรือไม่

**Returns:** `true` หรือ `false`

---

## 🎨 การแสดงผลใน UI

### แสดง Status Effect บนตัวละคร

```javascript
// ใน Battle UI
{character.activeEffects?.map(effectInstance => (
    <div key={effectInstance.effect.id} className="status-icon">
        <span style={{ color: effectInstance.effect.color }}>
            {effectInstance.effect.emoji}
        </span>
        {effectInstance.stacks > 1 && (
            <span className="stack-count">{effectInstance.stacks}x</span>
        )}
        <span className="duration">{effectInstance.remainingDuration}</span>
    </div>
))}
```

### แสดงข้อความเมื่อเกิด Effect

```javascript
const results = processStatusEffects(character, character.activeEffects, 'turn_start');

results.messages.forEach(message => {
    showBattleMessage(message);  // แสดงข้อความในเกม
});
```

---

## 🚀 การเพิ่ม Status Effect ใหม่

### วิธีที่ 1: ใช้ Status Effects Manager (แนะนำ)

1. เปิด Admin Panel
2. คลิก tab "✨ Status Effects"
3. กดปุ่ม "➕ สร้าง Effect ใหม่"
4. กรอกข้อมูล:
   - ข้อมูลพื้นฐาน (ชื่อ, emoji, สี)
   - เลือกประเภท Effect
   - กำหนด Logic (ระยะเวลา, ค่า, เป้าหมาย)
5. ดูตัวอย่าง Real-time
6. กด "➕ สร้าง"
7. Export JSON (ถ้าต้องการ)

### วิธีที่ 2: เพิ่มใน Code โดยตรง

```javascript
// ใน gameData.js
export const STATUS_EFFECTS = {
    // ... effects เดิม
    
    my_new_effect: {
        id: 'my_new_effect',
        name: 'Effect ใหม่',
        emoji: '✨',
        color: '#00ff00',
        description: 'คำอธิบายสั้น',
        effect: 'คำอธิบายเต็ม',
        displayType: 'icon',
        logic: {
            effectType: 'damage_over_time',
            duration: 2,
            value: 20,
            percentage: false,
            stackable: false,
            maxStacks: 1,
            triggerTiming: 'turn_start',
            targetStat: 'hp',
            modifierType: 'add'
        }
    }
};
```

---

## ✅ Checklist การสร้าง Effect ใหม่

- [ ] กำหนด ID (ไม่ซ้ำ, ภาษาอังกฤษ)
- [ ] เลือก Emoji และสีที่เหมาะสม
- [ ] เขียนคำอธิบายที่ชัดเจน
- [ ] เลือก Effect Type ที่ถูกต้อง
- [ ] กำหนดค่าที่สมดุล (ไม่แรงหรืออ่อนเกินไป)
- [ ] ทดสอบใน Battle System
- [ ] ตรวจสอบ UI แสดงผลถูกต้อง
- [ ] เพิ่มใน Card Generator (ถ้าต้องการ)

---

## 🎯 Best Practices

1. **ตั้งชื่อ ID ให้ชัดเจน**
   - ✅ `poison_strong`, `buff_atk_30`
   - ❌ `effect1`, `new_effect`

2. **ใช้ Percentage สำหรับ Scaling**
   - DoT: ใช้ % ของ HP สูงสุด
   - Stat Modifiers: ใช้ % ของค่าพื้นฐาน

3. **จำกัดระยะเวลา**
   - Control Effects: 1-2 รอบ
   - Buffs/Debuffs: 2-3 รอบ
   - DoT: 2-4 รอบ

4. **สมดุลของ Stacking**
   - DoT: ซ้อนได้ 2-3 ครั้ง
   - Buffs: ไม่ควรซ้อน
   - Control: ไม่ควรซ้อน

5. **ทดสอบก่อนใช้จริง**
   - ทดสอบกับตัวละครหลายประเภท
   - ตรวจสอบความสมดุล
   - ทดสอบ Edge Cases

---

**สร้างโดย:** Kiro AI Assistant  
**วันที่:** 2026-02-17  
**เวอร์ชัน:** 2.0
