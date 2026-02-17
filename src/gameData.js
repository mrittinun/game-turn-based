// Element System and Balance Configuration
// Main Cycle (6 elements): Fire > Wind > Electric > Water > Ice > Earth > Fire
// Special Elements (2 elements): Dark <> Light (counter each other)
// Advantage: 1.2x damage (20% more)
// Disadvantage: 0.8x damage (20% less)

export const ELEMENTS = {
    FIRE: 'fire',
    WIND: 'wind',
    ELECTRIC: 'electric',
    WATER: 'water',
    ICE: 'ice',
    EARTH: 'earth',
    DARK: 'dark',
    LIGHT: 'light'
};

export const ELEMENT_INFO = {
    fire: { 
        name: 'ไฟ', 
        emoji: '🔥', 
        color: '#ff4d4d', 
        strong: 'wind',      // ไฟ > ลม
        weak: 'earth'        // ไฟ < ดิน
    },
    wind: { 
        name: 'ลม', 
        emoji: '💨', 
        color: '#a0d8f1', 
        strong: 'electric',  // ลม > สายฟ้า
        weak: 'fire'         // ลม < ไฟ
    },
    electric: { 
        name: 'สายฟ้า', 
        emoji: '⚡', 
        color: '#ffd700', 
        strong: 'water',     // สายฟ้า > น้ำ
        weak: 'wind'         // สายฟ้า < ลม
    },
    water: { 
        name: 'น้ำ', 
        emoji: '💧', 
        color: '#4facfe', 
        strong: 'ice',       // น้ำ > น้ำแข็ง
        weak: 'electric'     // น้ำ < สายฟ้า
    },
    ice: { 
        name: 'น้ำแข็ง', 
        emoji: '❄️', 
        color: '#87ceeb', 
        strong: 'earth',     // น้ำแข็ง > ดิน
        weak: 'water'        // น้ำแข็ง < น้ำ
    },
    earth: { 
        name: 'ดิน', 
        emoji: '🌍', 
        color: '#8b7355', 
        strong: 'fire',      // ดิน > ไฟ
        weak: 'ice'          // ดิน < น้ำแข็ง
    },
    dark: { 
        name: 'มืด', 
        emoji: '🌙', 
        color: '#4a148c', 
        strong: 'light',     // มืด > แสง
        weak: 'light'        // มืด < แสง (เอาชนะกันและกัน)
    },
    light: { 
        name: 'แสง', 
        emoji: '☀️', 
        color: '#fff9c4', 
        strong: 'dark',      // แสง > มืด
        weak: 'dark'         // แสง < มืด (เอาชนะกันและกัน)
    }
};

// Calculate damage multiplier based on element advantage
export const getElementMultiplier = (attackerElement, defenderElement) => {
    if (!attackerElement || !defenderElement) return 1.0;
    if (attackerElement === defenderElement) return 1.0; // Same element = neutral

    const attackerInfo = ELEMENT_INFO[attackerElement];
    if (!attackerInfo) return 1.0;

    if (attackerInfo.strong === defenderElement) return 1.2; // 20% more damage
    if (attackerInfo.weak === defenderElement) return 0.8;   // 20% less damage

    return 1.0; // Neutral
};

// Skill Types
export const SKILL_TYPES = {
    ULTIMATE: 'ultimate',    // อัลติเมท - พลังสูงสุด
    PASSIVE: 'passive',      // พาสซีฟ - ติดตัวตลอด
    NORMAL: 'normal'         // ธรรมดา - ใช้ได้ทั่วไป
};

// Status Effects System
export const STATUS_EFFECTS = {
    POISON: {
        id: 'poison',
        name: 'พิษ',
        emoji: '🧪',
        color: '#9c27b0',
        description: 'สูญเสีย HP ทุกรอบ',
        effect: 'ลด HP 5% ต่อรอบ เป็นเวลา 3 รอบ',
        displayType: 'icon' // icon, text, both
    },
    STUN: {
        id: 'stun',
        name: 'สตัน',
        emoji: '💫',
        color: '#ffd700',
        description: 'ไม่สามารถใช้สกิลได้',
        effect: 'ข้าม 1 รอบ',
        displayType: 'icon'
    },
    BURN: {
        id: 'burn',
        name: 'ไหม้',
        emoji: '🔥',
        color: '#ff5722',
        description: 'รับดาเมจต่อเนื่อง',
        effect: 'รับดาเมจ 30 ต่อรอบ เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    FREEZE: {
        id: 'freeze',
        name: 'แช่แข็ง',
        emoji: '🧊',
        color: '#00bcd4',
        description: 'ความเร็วลดลง',
        effect: 'ลดความเร็ว 50% เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    BLEED: {
        id: 'bleed',
        name: 'เลือดไหล',
        emoji: '🩸',
        color: '#d32f2f',
        description: 'สูญเสีย HP ต่อเนื่อง',
        effect: 'ลด HP 8% ต่อรอบ เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    SHIELD_BREAK: {
        id: 'shield_break',
        name: 'ทำลายโล่',
        emoji: '🛡️💥',
        color: '#ff9800',
        description: 'ทำลายโล่ป้องกัน',
        effect: 'ลบโล่ทั้งหมดของเป้าหมาย',
        displayType: 'text'
    },
    HEAL_BLOCK: {
        id: 'heal_block',
        name: 'ห้ามรักษา',
        emoji: '🚫💚',
        color: '#e91e63',
        description: 'ไม่สามารถรักษาได้',
        effect: 'ไม่สามารถรับการรักษาเป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    BUFF_ATK: {
        id: 'buff_atk',
        name: 'เพิ่มพลังโจมตี',
        emoji: '⚔️✨',
        color: '#4caf50',
        description: 'พลังโจมตีเพิ่มขึ้น',
        effect: 'เพิ่มพลังโจมตี 30% เป็นเวลา 3 รอบ',
        displayType: 'icon'
    },
    BUFF_DEF: {
        id: 'buff_def',
        name: 'เพิ่มการป้องกัน',
        emoji: '🛡️✨',
        color: '#2196f3',
        description: 'การป้องกันเพิ่มขึ้น',
        effect: 'ลดดาเมจที่ได้รับ 30% เป็นเวลา 3 รอบ',
        displayType: 'icon'
    },
    BUFF_SPD: {
        id: 'buff_spd',
        name: 'เพิ่มความเร็ว',
        emoji: '⚡✨',
        color: '#ffeb3b',
        description: 'ความเร็วเพิ่มขึ้น',
        effect: 'เพิ่มความเร็ว 50% เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    DEBUFF_ATK: {
        id: 'debuff_atk',
        name: 'ลดพลังโจมตี',
        emoji: '⚔️💔',
        color: '#9e9e9e',
        description: 'พลังโจมตีลดลง',
        effect: 'ลดพลังโจมตี 40% เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    DEBUFF_DEF: {
        id: 'debuff_def',
        name: 'ลดการป้องกัน',
        emoji: '🛡️💔',
        color: '#795548',
        description: 'การป้องกันลดลง',
        effect: 'เพิ่มดาเมจที่ได้รับ 40% เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    TAUNT: {
        id: 'taunt',
        name: 'ยั่วยุ',
        emoji: '😡',
        color: '#f44336',
        description: 'บังคับให้โจมตีตัวเอง',
        effect: 'ศัตรูต้องโจมตีตัวนี้เป็นเวลา 1 รอบ',
        displayType: 'icon'
    },
    REFLECT: {
        id: 'reflect',
        name: 'สะท้อนดาเมจ',
        emoji: '🪞',
        color: '#00e5ff',
        description: 'สะท้อนดาเมจกลับ',
        effect: 'สะท้อนดาเมจ 50% กลับไปยังผู้โจมตี เป็นเวลา 2 รอบ',
        displayType: 'icon'
    },
    LIFESTEAL: {
        id: 'lifesteal',
        name: 'ดูดเลือด',
        emoji: '🧛',
        color: '#c62828',
        description: 'ดูดเลือดจากศัตรู',
        effect: 'ฟื้นฟู HP 30% ของดาเมจที่สร้าง',
        displayType: 'text'
    },
    CLEANSE: {
        id: 'cleanse',
        name: 'ชำระล้าง',
        emoji: '✨',
        color: '#ffffff',
        description: 'ลบสถานะผลเสียทั้งหมด',
        effect: 'ลบ Debuff และสถานะผลเสียทั้งหมด',
        displayType: 'text'
    },
    REVIVE: {
        id: 'revive',
        name: 'ฟื้นคืนชีพ',
        emoji: '🔄',
        color: '#76ff03',
        description: 'ฟื้นคืนชีพเมื่อตาย',
        effect: 'ฟื้นคืนชีพด้วย HP 30% เมื่อถูกโจมตีจนตาย (ใช้ได้ 1 ครั้ง)',
        displayType: 'icon'
    },
    IMMUNITY: {
        id: 'immunity',
        name: 'ภูมิคุ้มกัน',
        emoji: '🛡️✨',
        color: '#ffd700',
        description: 'ภูมิคุ้มกันสถานะผลเสีย',
        effect: 'ภูมิคุ้มกันต่อสถานะผลเสียทั้งหมด เป็นเวลา 2 รอบ',
        displayType: 'icon'
    }
};

// New Cards Database with Element System
export const CARDS_DB = {
    // FIRE ELEMENT CARDS
    'fire_ult': {
        id: 'fire_ult',
        name: 'นรกเพลิง',
        element: 'fire',
        type: 'ultimate',
        energy: 3,
        damage: 200,
        shield: 0,
        targetType: 'lowest_hp',
        desc: 'โจมตีศัตรูตัวที่มี HP น้อยที่สุด'
    },
    'fire_passive': {
        id: 'fire_passive',
        name: 'ผิวหนังไฟ',
        element: 'fire',
        type: 'passive',
        energy: 0,
        damage: 0,
        shield: 40,
        desc: 'ได้รับโล่สะสมทบทุกรอบ'
    },
    'fire_normal1': {
        id: 'fire_normal1',
        name: 'ลูกไฟ',
        element: 'fire',
        type: 'normal',
        energy: 1,
        damage: 90,
        shield: 0,
        targetType: 'default',
        desc: 'โจมตีตัวที่อยู่ใกล้ที่สุด'
    },
    'fire_normal2': {
        id: 'fire_normal2',
        name: 'กำแพงไฟ',
        element: 'fire',
        type: 'normal',
        energy: 1,
        damage: 50,
        shield: 60,
        targetType: 'default',
        desc: 'โจมตีพร้อมสร้างโล่ป้องกัน'
    },

    // WATER ELEMENT CARDS
    'water_ult': {
        id: 'water_ult',
        name: 'สึนามิ',
        element: 'water',
        type: 'ultimate',
        energy: 3,
        damage: 180,
        shield: 50,
        targetType: 'back',
        desc: 'ทะลวงโจมตีศัตรูตัวหลังสุด'
    },
    'water_passive': {
        id: 'water_passive',
        name: 'ฟื้นฟูน้ำ',
        element: 'water',
        type: 'passive',
        energy: 0,
        damage: -30,
        shield: 0,
        desc: 'ฟื้นฟูพลังชีวิตตัวเองทุกรอบ'
    },
    'water_normal1': {
        id: 'water_normal1',
        name: 'กระสุนน้ำ',
        element: 'water',
        type: 'normal',
        energy: 1,
        damage: 85,
        shield: 30,
        targetType: 'default',
        desc: 'โจมตีตัวหน้าที่แรงดันสูง'
    },
    'water_normal2': {
        id: 'water_normal2',
        name: 'ฟองสบู่',
        element: 'water',
        type: 'normal',
        energy: 1,
        damage: 60,
        shield: 50,
        targetType: 'default',
        desc: 'สร้างฟองสบู่ลดดาเมจ'
    },

    // EARTH ELEMENT CARDS
    'earth_ult': {
        id: 'earth_ult',
        name: 'แผ่นดินไหว',
        element: 'earth',
        type: 'ultimate',
        energy: 3,
        damage: 190,
        shield: 80,
        targetType: 'front',
        desc: 'ทลายแนวหน้าศัตรูอย่างรุนแรง'
    },
    'earth_passive': {
        id: 'earth_passive',
        name: 'ผิวหินแกรนิต',
        element: 'earth',
        type: 'passive',
        energy: 0,
        damage: 0,
        shield: 50,
        desc: 'เสริมพลังป้องกันถาวรทุกรอบ'
    },
    'earth_normal1': {
        id: 'earth_normal1',
        name: 'ก้อนหิน',
        element: 'earth',
        type: 'normal',
        energy: 1,
        damage: 95,
        shield: 20,
        targetType: 'default',
        desc: 'ขว้างหินบดขยี้ตัวหน้า'
    },
    'earth_normal2': {
        id: 'earth_normal2',
        name: 'เกราะหิน',
        element: 'earth',
        type: 'normal',
        energy: 1,
        damage: 40,
        shield: 80,
        targetType: 'default',
        desc: 'ตั้งป้อมเสริมเกราะหินหนา'
    },

    // WIND ELEMENT CARDS
    'wind_ult': {
        id: 'wind_ult',
        name: 'พายุทอร์นาโด',
        element: 'wind',
        type: 'ultimate',
        energy: 3,
        damage: 210,
        shield: 0,
        targetType: 'highest_hp',
        desc: 'โจมตีศัตรูที่มี HP สูงที่สุด'
    },
    'wind_passive': {
        id: 'wind_passive',
        name: 'ปีกแห่งลม',
        element: 'wind',
        type: 'passive',
        energy: 0,
        damage: 0,
        shield: 10,
        speedBonus: 10,
        desc: 'เพิ่มความเร็วและการป้องกัน'
    },
    'wind_normal1': {
        id: 'wind_normal1',
        name: 'ใบมีดลม',
        element: 'wind',
        type: 'normal',
        energy: 1,
        damage: 100,
        shield: 0,
        targetType: 'default',
        desc: 'ฟาดฟันศัตรูอย่างรวดเร็ว'
    },
    'wind_normal2': {
        id: 'wind_normal2',
        name: 'กระแสลม',
        element: 'wind',
        type: 'normal',
        energy: 1,
        damage: 70,
        shield: 40,
        targetType: 'default',
        desc: 'โจมตีพร้อมพัดพาสิ่งป้องกัน'
    },

    // ELECTRIC ELEMENT CARDS
    'electric_ult': {
        id: 'electric_ult',
        name: 'ฟ้าผ่า',
        element: 'electric',
        type: 'ultimate',
        energy: 3,
        damage: 220,
        shield: 0,
        targetType: 'lowest_hp',
        desc: 'ฟ้าผ่าสังหารเป้าหมายที่อ่อนแอ'
    },
    'electric_passive': {
        id: 'electric_passive',
        name: 'ประจุไฟฟ้า',
        element: 'electric',
        type: 'passive',
        energy: 0,
        damage: 15,
        shield: 0,
        desc: 'ปล่อยประจุไฟฟ้าทุกรอบ'
    },
    'electric_normal1': {
        id: 'electric_normal1',
        name: 'กระแสไฟฟ้า',
        element: 'electric',
        type: 'normal',
        energy: 1,
        damage: 95,
        shield: 0,
        targetType: 'default',
        desc: 'ปล่อยกระแสไฟฟ้าโจมตี'
    },
    'electric_normal2': {
        id: 'electric_normal2',
        name: 'สนามไฟฟ้า',
        element: 'electric',
        type: 'normal',
        energy: 1,
        damage: 75,
        shield: 30,
        targetType: 'default',
        desc: 'สร้างสนามไฟฟ้าป้องกัน'
    },

    // ICE ELEMENT CARDS
    'ice_ult': {
        id: 'ice_ult',
        name: 'พายุหิมะ',
        element: 'ice',
        type: 'ultimate',
        energy: 3,
        damage: 190,
        shield: 70,
        targetType: 'front',
        desc: 'พายุหิมะแช่แข็งแนวหน้า'
    },
    'ice_passive': {
        id: 'ice_passive',
        name: 'เกราะน้ำแข็ง',
        element: 'ice',
        type: 'passive',
        energy: 0,
        damage: 0,
        shield: 35,
        desc: 'เกราะน้ำแข็งป้องกันต่อเนื่อง'
    },
    'ice_normal1': {
        id: 'ice_normal1',
        name: 'หอกน้ำแข็ง',
        element: 'ice',
        type: 'normal',
        energy: 1,
        damage: 85,
        shield: 35,
        targetType: 'default',
        desc: 'ยิงหอกน้ำแข็งแทงทะลุ'
    },
    'ice_normal2': {
        id: 'ice_normal2',
        name: 'กำแพงน้ำแข็ง',
        element: 'ice',
        type: 'normal',
        energy: 1,
        damage: 50,
        shield: 70,
        targetType: 'default',
        desc: 'สร้างกำแพงน้ำแข็งหนา'
    }
};

// Character Pool with Element System (4 skills each)
// Note: image and skillImages fields are optional and can be added via Admin Panel
export const CHARACTER_POOL = [
    {
        id: 'p1',
        name: 'ไฟร์ดราก้อน',
        element: 'fire',
        hp: 450,
        maxHp: 450,
        shield: 0,
        emoji: '🐲',
        attack: 70,
        speed: 40,
        cards: ['fire_ult', 'fire_passive', 'fire_normal1', 'fire_normal2'],
        ability: 'มังกรไฟ โจมตีแรง เอาชนะลมได้',
        class: 'balanced',
        image: null, // Base64 image data (optional)
        imageUrl: '', // Image URL (optional)
        skillImages: { // Skill images (optional)
            ultimate: null,
            passive: null,
            normal1: null,
            normal2: null
        }
    },
    {
        id: 'p2',
        name: 'วอเตอร์ตอร์ทอยส์',
        element: 'water',
        hp: 480,
        maxHp: 480,
        shield: 0,
        emoji: '🐢',
        attack: 60,
        speed: 35,
        cards: ['water_ult', 'water_passive', 'water_normal1', 'water_normal2'],
        ability: 'เต่าน้ำ ฟื้นฟูตัวเอง เอาชนะน้ำแข็งได้',
        class: 'tank'
    },
    {
        id: 'p3',
        name: 'เอิร์ธไรโน',
        element: 'earth',
        hp: 520,
        maxHp: 520,
        shield: 0,
        emoji: '🦏',
        attack: 65,
        speed: 30,
        cards: ['earth_ult', 'earth_passive', 'earth_normal1', 'earth_normal2'],
        ability: 'แรดหิน ป้องกันสูง เอาชนะไฟได้',
        class: 'tank'
    },
    {
        id: 'p4',
        name: 'วินด์อีเกิล',
        element: 'wind',
        hp: 380,
        maxHp: 380,
        shield: 0,
        emoji: '🦅',
        attack: 85,
        speed: 60,
        cards: ['wind_ult', 'wind_passive', 'wind_normal1', 'wind_normal2'],
        ability: 'นกอินทรี รวดเร็ว เอาชนะสายฟ้าได้',
        class: 'dps'
    },
    {
        id: 'p5',
        name: 'ไฟร์ฟ็อกซ์',
        element: 'fire',
        hp: 400,
        maxHp: 400,
        shield: 0,
        emoji: '🦊',
        attack: 75,
        speed: 50,
        cards: ['fire_ult', 'fire_passive', 'fire_normal1', 'fire_normal2'],
        ability: 'จิ้งจอกไฟ คล่องแคล่ว เอาชนะลมได้',
        class: 'balanced'
    },
    {
        id: 'p6',
        name: 'วอเตอร์ออคโทปัส',
        element: 'water',
        hp: 420,
        maxHp: 420,
        shield: 0,
        emoji: '🐙',
        attack: 70,
        speed: 45,
        cards: ['water_ult', 'water_passive', 'water_normal1', 'water_normal2'],
        ability: 'หมึกน้ำ ยืดหยุ่น เอาชนะน้ำแข็งได้',
        class: 'support'
    },
    {
        id: 'p7',
        name: 'เอิร์ธบูลล์',
        element: 'earth',
        hp: 500,
        maxHp: 500,
        shield: 0,
        emoji: '🐂',
        attack: 68,
        speed: 32,
        cards: ['earth_ult', 'earth_passive', 'earth_normal1', 'earth_normal2'],
        ability: 'วัวดิน ทนทาน เอาชนะไฟได้',
        class: 'tank'
    },
    {
        id: 'p8',
        name: 'วินด์ฮอว์ค',
        element: 'wind',
        hp: 360,
        maxHp: 360,
        shield: 0,
        emoji: '🦜',
        attack: 80,
        speed: 55,
        cards: ['wind_ult', 'wind_passive', 'wind_normal1', 'wind_normal2'],
        ability: 'นกเหยี่ยว แม่นยำ เอาชนะสายฟ้าได้',
        class: 'dps'
    },
    {
        id: 'p9',
        name: 'ไลท์นิ่งไทเกอร์',
        element: 'electric',
        hp: 390,
        maxHp: 390,
        shield: 0,
        emoji: '🐯',
        attack: 88,
        speed: 58,
        cards: ['electric_ult', 'electric_passive', 'electric_normal1', 'electric_normal2'],
        ability: 'เสือสายฟ้า รวดเร็วและร้ายแรง เอาชนะน้ำได้',
        class: 'dps'
    },
    {
        id: 'p10',
        name: 'ไอซ์วูล์ฟ',
        element: 'ice',
        hp: 440,
        maxHp: 440,
        shield: 0,
        emoji: '🐺',
        attack: 72,
        speed: 42,
        cards: ['ice_ult', 'ice_passive', 'ice_normal1', 'ice_normal2'],
        ability: 'หมาป่าน้ำแข็ง ทนทานและเย็นชา เอาชนะดินได้',
        class: 'balanced'
    },
    {
        id: 'p11',
        name: 'ธันเดอร์เบิร์ด',
        element: 'electric',
        hp: 370,
        maxHp: 370,
        shield: 0,
        emoji: '🦅',
        attack: 90,
        speed: 62,
        cards: ['electric_ult', 'electric_passive', 'electric_normal1', 'electric_normal2'],
        ability: 'นกสายฟ้า โจมตีเร็วและแม่นยำ เอาชนะน้ำได้',
        class: 'dps'
    },
    {
        id: 'p12',
        name: 'ไอซ์เบียร์',
        element: 'ice',
        hp: 510,
        maxHp: 510,
        shield: 0,
        emoji: '🐻‍❄️',
        attack: 62,
        speed: 28,
        cards: ['ice_ult', 'ice_passive', 'ice_normal1', 'ice_normal2'],
        ability: 'หมีขั้วโลก แข็งแกร่งและทนทาน เอาชนะดินได้',
        class: 'tank'
    }
];

// Enemy Pool with Element System
export const INITIAL_ENEMIES = [
    { id: 'e1', name: 'สไลม์ไฟ', element: 'fire', hp: 400, maxHp: 400, shield: 0, emoji: '🔥', attack: 65, speed: 38, position: 0 },
    { id: 'e2', name: 'หมึกน้ำ', element: 'water', hp: 420, maxHp: 420, shield: 0, emoji: '🐙', attack: 60, speed: 42, position: 4 },
    { id: 'e3', name: 'ผึ้งลม', element: 'wind', hp: 380, maxHp: 380, shield: 0, emoji: '🐝', attack: 70, speed: 52, position: 8 }
];

