/**
 * Status Effects Engine
 * ระบบคำนวณและประมวลผล Status Effects ในเกม
 */

/**
 * คำนวณเอฟเฟกต์ที่เกิดขึ้นในแต่ละรอบ
 * @param {Object} character - ตัวละครที่มี status effects
 * @param {Array} activeEffects - รายการ effects ที่กำลังทำงาน
 * @param {String} timing - เวลาที่เรียกใช้ (turn_start, turn_end, on_hit, on_damaged)
 * @returns {Object} ผลลัพธ์การคำนวณ
 */
export function processStatusEffects(character, activeEffects, timing = 'turn_start') {
    const results = {
        damageDealt: 0,
        healingDone: 0,
        statModifiers: {},
        effectsExpired: [],
        effectsTriggered: [],
        messages: []
    };

    if (!activeEffects || activeEffects.length === 0) {
        return results;
    }

    activeEffects.forEach(effectInstance => {
        const { effect, remainingDuration, stacks } = effectInstance;
        
        // ตรวจสอบว่าเป็นเวลาที่ effect นี้ควรทำงานหรือไม่
        if (effect.logic.triggerTiming !== timing && effect.logic.triggerTiming !== 'continuous') {
            return;
        }

        // ประมวลผลตามประเภทของ effect
        switch (effect.logic.effectType) {
            case 'damage_over_time':
                const dotResult = calculateDamageOverTime(character, effect, stacks);
                results.damageDealt += dotResult.damage;
                results.messages.push(dotResult.message);
                results.effectsTriggered.push(effect.id);
                break;

            case 'stat_modifier':
                const modResult = calculateStatModifier(character, effect, stacks);
                results.statModifiers[effect.logic.targetStat] = modResult.value;
                results.messages.push(modResult.message);
                results.effectsTriggered.push(effect.id);
                break;

            case 'control':
                const controlResult = applyControlEffect(character, effect);
                if (controlResult.blocked) {
                    results.messages.push(controlResult.message);
                    results.effectsTriggered.push(effect.id);
                }
                break;

            case 'instant':
                // Instant effects ทำงานทันทีตอนใช้ ไม่ต้องประมวลผลในรอบ
                break;

            case 'passive':
                const passiveResult = applyPassiveEffect(character, effect, stacks);
                Object.assign(results.statModifiers, passiveResult.modifiers);
                results.effectsTriggered.push(effect.id);
                break;

            case 'shield':
                // Shield จะถูกคำนวณตอนรับดาเมจ
                break;

            case 'heal':
                const healResult = calculateHealing(character, effect, stacks);
                results.healingDone += healResult.healing;
                results.messages.push(healResult.message);
                results.effectsTriggered.push(effect.id);
                break;
        }

        // ลดระยะเวลาที่เหลือ
        effectInstance.remainingDuration--;
        if (effectInstance.remainingDuration <= 0) {
            results.effectsExpired.push(effect.id);
            results.messages.push(`${effect.emoji} ${effect.name} หมดอายุ`);
        }
    });

    return results;
}

/**
 * คำนวณดาเมจต่อเนื่อง (Damage Over Time)
 */
function calculateDamageOverTime(character, effect, stacks = 1) {
    const { value, percentage } = effect.logic;
    let damage = 0;

    if (percentage) {
        // คำนวณจาก % ของ HP สูงสุด
        damage = (character.maxHp * value / 100) * stacks;
    } else {
        // ค่าคงที่
        damage = value * stacks;
    }

    return {
        damage: Math.round(damage),
        message: `${effect.emoji} ${effect.name}: -${Math.round(damage)} HP`
    };
}

/**
 * คำนวณการปรับค่าสถานะ (Stat Modifier)
 */
function calculateStatModifier(character, effect, stacks = 1) {
    const { targetStat, modifierType, value, percentage } = effect.logic;
    let modifiedValue = 0;
    const baseStat = character[targetStat] || 0;

    switch (modifierType) {
        case 'add':
            if (percentage) {
                modifiedValue = baseStat * (value / 100) * stacks;
            } else {
                modifiedValue = value * stacks;
            }
            break;

        case 'multiply':
            modifiedValue = baseStat * value * stacks;
            break;

        case 'set':
            modifiedValue = value;
            break;
    }

    const sign = modifiedValue >= 0 ? '+' : '';
    return {
        value: modifiedValue,
        message: `${effect.emoji} ${effect.name}: ${sign}${Math.round(modifiedValue)} ${targetStat.toUpperCase()}`
    };
}

/**
 * ใช้เอฟเฟกต์ควบคุม (Control Effect)
 */
function applyControlEffect(character, effect) {
    // Control effects จะบล็อกการกระทำ
    return {
        blocked: true,
        message: `${effect.emoji} ${character.name} ถูก ${effect.name}!`
    };
}

/**
 * ใช้เอฟเฟกต์พาสซีฟ (Passive Effect)
 */
function applyPassiveEffect(character, effect, stacks = 1) {
    const modifiers = {};
    
    // Passive effects ทำงานต่อเนื่อง
    if (effect.logic.targetStat) {
        const { targetStat, value, percentage } = effect.logic;
        const baseStat = character[targetStat] || 0;
        
        if (percentage) {
            modifiers[targetStat] = baseStat * (value / 100) * stacks;
        } else {
            modifiers[targetStat] = value * stacks;
        }
    }

    return { modifiers };
}

/**
 * คำนวณการรักษา (Healing)
 */
function calculateHealing(character, effect, stacks = 1) {
    const { value, percentage } = effect.logic;
    let healing = 0;

    if (percentage) {
        healing = (character.maxHp * value / 100) * stacks;
    } else {
        healing = value * stacks;
    }

    return {
        healing: Math.round(healing),
        message: `${effect.emoji} ${effect.name}: +${Math.round(healing)} HP`
    };
}

/**
 * คำนวณดาเมจที่ได้รับ (พิจารณา shields และ modifiers)
 */
export function calculateIncomingDamage(character, baseDamage, activeEffects) {
    let finalDamage = baseDamage;
    let shieldAbsorbed = 0;
    const messages = [];

    // หา defense modifiers
    const defenseModifier = activeEffects
        .filter(e => e.effect.logic.targetStat === 'defense')
        .reduce((sum, e) => sum + (e.effect.logic.value * e.stacks), 0);

    // ลดดาเมจจาก defense
    if (defenseModifier !== 0) {
        const reduction = defenseModifier / 100;
        finalDamage = baseDamage * (1 - reduction);
        messages.push(`🛡️ ลดดาเมจ ${Math.abs(Math.round(reduction * 100))}%`);
    }

    // ตรวจสอบ shield
    const shieldEffect = activeEffects.find(e => e.effect.logic.effectType === 'shield');
    if (shieldEffect && character.shield > 0) {
        if (character.shield >= finalDamage) {
            shieldAbsorbed = finalDamage;
            finalDamage = 0;
            messages.push(`🛡️ โล่ดูดซับดาเมจทั้งหมด`);
        } else {
            shieldAbsorbed = character.shield;
            finalDamage -= character.shield;
            messages.push(`🛡️ โล่ดูดซับดาเมจ ${shieldAbsorbed}`);
        }
    }

    // ตรวจสอบ reflect
    const reflectEffect = activeEffects.find(e => e.effect.id === 'reflect');
    let reflectedDamage = 0;
    if (reflectEffect) {
        reflectedDamage = Math.round(baseDamage * 0.5);
        messages.push(`🪞 สะท้อนดาเมจ ${reflectedDamage} กลับ`);
    }

    return {
        finalDamage: Math.round(finalDamage),
        shieldAbsorbed,
        reflectedDamage,
        messages
    };
}

/**
 * เพิ่ม Status Effect ให้กับตัวละคร
 */
export function applyStatusEffect(character, effect, caster) {
    if (!character.activeEffects) {
        character.activeEffects = [];
    }

    // ตรวจสอบว่ามี immunity หรือไม่
    const hasImmunity = character.activeEffects.some(e => e.effect.id === 'immunity');
    if (hasImmunity && effect.logic.effectType !== 'passive') {
        return {
            success: false,
            message: `🛡️✨ ${character.name} มีภูมิคุ้มกัน!`
        };
    }

    // ตรวจสอบว่า effect นี้สามารถซ้อนทับได้หรือไม่
    const existingEffect = character.activeEffects.find(e => e.effect.id === effect.id);
    
    if (existingEffect) {
        if (effect.logic.stackable && existingEffect.stacks < effect.logic.maxStacks) {
            existingEffect.stacks++;
            existingEffect.remainingDuration = effect.logic.duration;
            return {
                success: true,
                message: `${effect.emoji} ${effect.name} ซ้อนทับ (${existingEffect.stacks}x)`
            };
        } else {
            // รีเซ็ตระยะเวลา
            existingEffect.remainingDuration = effect.logic.duration;
            return {
                success: true,
                message: `${effect.emoji} ${effect.name} รีเซ็ตระยะเวลา`
            };
        }
    }

    // เพิ่ม effect ใหม่
    character.activeEffects.push({
        effect: effect,
        remainingDuration: effect.logic.duration,
        stacks: 1,
        caster: caster
    });

    // ประมวลผล instant effects
    if (effect.logic.effectType === 'instant') {
        return processInstantEffect(character, effect);
    }

    return {
        success: true,
        message: `${effect.emoji} ${character.name} ได้รับ ${effect.name}!`
    };
}

/**
 * ประมวลผล Instant Effects
 */
function processInstantEffect(character, effect) {
    const messages = [];

    switch (effect.id) {
        case 'shield_break':
            const shieldRemoved = character.shield || 0;
            character.shield = 0;
            messages.push(`🛡️💥 ทำลายโล่ ${shieldRemoved}`);
            break;

        case 'cleanse':
            const removedCount = character.activeEffects.filter(e => 
                ['poison', 'stun', 'burn', 'freeze', 'bleed', 'heal_block', 'debuff_atk', 'debuff_def'].includes(e.effect.id)
            ).length;
            character.activeEffects = character.activeEffects.filter(e => 
                !['poison', 'stun', 'burn', 'freeze', 'bleed', 'heal_block', 'debuff_atk', 'debuff_def'].includes(e.effect.id)
            );
            messages.push(`✨ ชำระล้าง ${removedCount} สถานะผลเสีย`);
            break;

        case 'lifesteal':
            // Lifesteal จะถูกคำนวณตอนสร้างดาเมจ
            messages.push(`🧛 เปิดใช้งานดูดเลือด`);
            break;
    }

    return {
        success: true,
        message: messages.join(', ')
    };
}

/**
 * ลบ Status Effects ที่หมดอายุ
 */
export function removeExpiredEffects(character) {
    if (!character.activeEffects) return;

    character.activeEffects = character.activeEffects.filter(e => e.remainingDuration > 0);
}

/**
 * ตรวจสอบว่าตัวละครสามารถกระทำได้หรือไม่ (ตรวจสอบ control effects)
 */
export function canAct(character) {
    if (!character.activeEffects) return true;

    const controlEffects = character.activeEffects.filter(e => 
        e.effect.logic.effectType === 'control'
    );

    return controlEffects.length === 0;
}

/**
 * คำนวณค่าสถานะสุดท้าย (รวม modifiers ทั้งหมด)
 */
export function calculateFinalStats(character) {
    const baseStats = {
        hp: character.hp,
        maxHp: character.maxHp,
        attack: character.attack,
        defense: character.defense || 0,
        speed: character.speed,
        shield: character.shield || 0
    };

    if (!character.activeEffects || character.activeEffects.length === 0) {
        return baseStats;
    }

    const finalStats = { ...baseStats };

    // รวม modifiers จาก passive effects
    character.activeEffects.forEach(effectInstance => {
        if (effectInstance.effect.logic.effectType === 'passive' || 
            effectInstance.effect.logic.effectType === 'stat_modifier') {
            
            const { targetStat, modifierType, value, percentage } = effectInstance.effect.logic;
            const stacks = effectInstance.stacks;

            if (targetStat && finalStats[targetStat] !== undefined) {
                let modifier = 0;

                if (modifierType === 'add') {
                    if (percentage) {
                        modifier = baseStats[targetStat] * (value / 100) * stacks;
                    } else {
                        modifier = value * stacks;
                    }
                    finalStats[targetStat] += modifier;
                } else if (modifierType === 'multiply') {
                    finalStats[targetStat] *= (value * stacks);
                }
            }
        }
    });

    // ตรวจสอบไม่ให้ค่าติดลบ
    Object.keys(finalStats).forEach(stat => {
        if (finalStats[stat] < 0) finalStats[stat] = 0;
    });

    return finalStats;
}
