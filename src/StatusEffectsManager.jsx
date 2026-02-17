import React, { useState } from 'react';
import { STATUS_EFFECTS } from './gameData';

export default function StatusEffectsManager({ onSave }) {
    const [effects, setEffects] = useState(STATUS_EFFECTS);
    const [editingEffect, setEditingEffect] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newEffect, setNewEffect] = useState({
        id: '',
        name: '',
        emoji: '',
        color: '#ffffff',
        description: '',
        effect: '',
        displayType: 'icon',
        // Logic Configuration
        effectType: 'damage_over_time', // damage_over_time, stat_modifier, control, instant, passive
        duration: 2,
        value: 0,
        percentage: false,
        stackable: false,
        maxStacks: 1,
        triggerTiming: 'turn_start', // turn_start, turn_end, on_hit, on_damaged, continuous
        targetStat: null, // hp, attack, defense, speed, shield
        modifierType: null // add, multiply, set
    });

    const effectTypes = {
        damage_over_time: {
            name: 'ดาเมจต่อเนื่อง (DoT)',
            description: 'สร้างดาเมจทุกรอบ',
            requiredFields: ['value', 'duration', 'percentage'],
            example: 'พิษ, ไหม้, เลือดไหล'
        },
        stat_modifier: {
            name: 'ปรับค่าสถานะ',
            description: 'เพิ่ม/ลดค่าสถานะ',
            requiredFields: ['targetStat', 'modifierType', 'value', 'duration', 'percentage'],
            example: 'Buff ATK, Debuff DEF, เพิ่มความเร็ว'
        },
        control: {
            name: 'ควบคุม',
            description: 'ควบคุมการกระทำ',
            requiredFields: ['duration'],
            example: 'สตัน, แช่แข็ง, ยั่วยุ'
        },
        instant: {
            name: 'ทันที',
            description: 'เกิดผลทันทีแล้วหมดไป',
            requiredFields: ['value'],
            example: 'ทำลายโล่, ชำระล้าง, ดูดเลือด'
        },
        passive: {
            name: 'พาสซีฟ',
            description: 'ติดตัวตลอดการต่อสู้',
            requiredFields: ['value', 'percentage'],
            example: 'สะท้อนดาเมจ, ภูมิคุ้มกัน, ฟื้นคืนชีพ'
        },
        shield: {
            name: 'โล่',
            description: 'สร้างโล่ป้องกัน',
            requiredFields: ['value', 'duration'],
            example: 'โล่พลังงาน, กำแพงน้ำแข็ง'
        },
        heal: {
            name: 'รักษา',
            description: 'ฟื้นฟู HP',
            requiredFields: ['value', 'percentage'],
            example: 'รักษาต่อเนื่อง, ฟื้นฟูทันที'
        }
    };

    const handleCreateEffect = () => {
        if (!newEffect.id || !newEffect.name) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const updatedEffects = {
            ...effects,
            [newEffect.id]: {
                id: newEffect.id,
                name: newEffect.name,
                emoji: newEffect.emoji,
                color: newEffect.color,
                description: newEffect.description,
                effect: newEffect.effect,
                displayType: newEffect.displayType,
                // Logic
                logic: {
                    effectType: newEffect.effectType,
                    duration: newEffect.duration,
                    value: newEffect.value,
                    percentage: newEffect.percentage,
                    stackable: newEffect.stackable,
                    maxStacks: newEffect.maxStacks,
                    triggerTiming: newEffect.triggerTiming,
                    targetStat: newEffect.targetStat,
                    modifierType: newEffect.modifierType
                }
            }
        };

        setEffects(updatedEffects);
        if (onSave) onSave(updatedEffects);
        
        // Reset form
        setNewEffect({
            id: '',
            name: '',
            emoji: '',
            color: '#ffffff',
            description: '',
            effect: '',
            displayType: 'icon',
            effectType: 'damage_over_time',
            duration: 2,
            value: 0,
            percentage: false,
            stackable: false,
            maxStacks: 1,
            triggerTiming: 'turn_start',
            targetStat: null,
            modifierType: null
        });
        setShowCreateForm(false);
        alert('✅ สร้าง Status Effect สำเร็จ!');
    };

    const handleDeleteEffect = (effectId) => {
        if (!confirm(`ต้องการลบ ${effects[effectId].name} ใช่หรือไม่?`)) return;
        
        const updatedEffects = { ...effects };
        delete updatedEffects[effectId];
        setEffects(updatedEffects);
        if (onSave) onSave(updatedEffects);
    };

    const handleEditEffect = (effectId) => {
        const effect = effects[effectId];
        setNewEffect({
            id: effect.id,
            name: effect.name,
            emoji: effect.emoji,
            color: effect.color,
            description: effect.description,
            effect: effect.effect,
            displayType: effect.displayType,
            ...effect.logic
        });
        setEditingEffect(effectId);
        setShowCreateForm(true);
    };

    const exportEffects = () => {
        const dataStr = JSON.stringify(effects, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'status-effects.json';
        link.click();
    };

    return (
        <div className="status-effects-manager">
            <div className="manager-header">
                <h2>⚙️ จัดการ Status Effects</h2>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={exportEffects}>
                        💾 Export JSON
                    </button>
                    <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                        ➕ สร้าง Effect ใหม่
                    </button>
                </div>
            </div>

            {showCreateForm && (
                <div className="create-form-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingEffect ? '✏️ แก้ไข' : '➕ สร้าง'} Status Effect</h3>
                            <button className="close-btn" onClick={() => {
                                setShowCreateForm(false);
                                setEditingEffect(null);
                            }}>✕</button>
                        </div>

                        <div className="form-content">
                            {/* Basic Info */}
                            <div className="form-section">
                                <h4>📝 ข้อมูลพื้นฐาน</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>ID (ภาษาอังกฤษ, ไม่มีช่องว่าง)</label>
                                        <input
                                            type="text"
                                            value={newEffect.id}
                                            onChange={(e) => setNewEffect({...newEffect, id: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                                            placeholder="poison_strong"
                                            disabled={editingEffect}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ชื่อ (ภาษาไทย)</label>
                                        <input
                                            type="text"
                                            value={newEffect.name}
                                            onChange={(e) => setNewEffect({...newEffect, name: e.target.value})}
                                            placeholder="พิษรุนแรง"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Emoji</label>
                                        <input
                                            type="text"
                                            value={newEffect.emoji}
                                            onChange={(e) => setNewEffect({...newEffect, emoji: e.target.value})}
                                            placeholder="🧪"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>สี</label>
                                        <input
                                            type="color"
                                            value={newEffect.color}
                                            onChange={(e) => setNewEffect({...newEffect, color: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>คำอธิบายสั้น</label>
                                    <input
                                        type="text"
                                        value={newEffect.description}
                                        onChange={(e) => setNewEffect({...newEffect, description: e.target.value})}
                                        placeholder="สูญเสีย HP ทุกรอบ"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>คำอธิบายเต็ม</label>
                                    <textarea
                                        value={newEffect.effect}
                                        onChange={(e) => setNewEffect({...newEffect, effect: e.target.value})}
                                        placeholder="ลด HP 10% ต่อรอบ เป็นเวลา 3 รอบ"
                                        rows="2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>วิธีแสดงผล</label>
                                    <select
                                        value={newEffect.displayType}
                                        onChange={(e) => setNewEffect({...newEffect, displayType: e.target.value})}
                                    >
                                        <option value="icon">🎨 ไอคอน</option>
                                        <option value="text">📝 ข้อความ</option>
                                        <option value="both">🎨📝 ทั้งสอง</option>
                                    </select>
                                </div>
                            </div>

                            {/* Logic Configuration */}
                            <div className="form-section">
                                <h4>⚙️ การทำงาน (Logic)</h4>
                                
                                <div className="form-group">
                                    <label>ประเภทเอฟเฟกต์</label>
                                    <select
                                        value={newEffect.effectType}
                                        onChange={(e) => setNewEffect({...newEffect, effectType: e.target.value})}
                                    >
                                        {Object.entries(effectTypes).map(([key, type]) => (
                                            <option key={key} value={key}>
                                                {type.name} - {type.example}
                                            </option>
                                        ))}
                                    </select>
                                    <small>{effectTypes[newEffect.effectType].description}</small>
                                </div>

                                {/* Conditional Fields based on effectType */}
                                {effectTypes[newEffect.effectType].requiredFields.includes('duration') && (
                                    <div className="form-group">
                                        <label>ระยะเวลา (รอบ)</label>
                                        <input
                                            type="number"
                                            value={newEffect.duration}
                                            onChange={(e) => setNewEffect({...newEffect, duration: parseInt(e.target.value)})}
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                )}

                                {effectTypes[newEffect.effectType].requiredFields.includes('value') && (
                                    <div className="form-group">
                                        <label>ค่าที่ส่งผล</label>
                                        <input
                                            type="number"
                                            value={newEffect.value}
                                            onChange={(e) => setNewEffect({...newEffect, value: parseFloat(e.target.value)})}
                                            step="0.1"
                                        />
                                    </div>
                                )}

                                {effectTypes[newEffect.effectType].requiredFields.includes('percentage') && (
                                    <div className="form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={newEffect.percentage}
                                                onChange={(e) => setNewEffect({...newEffect, percentage: e.target.checked})}
                                            />
                                            {' '}ใช้เปอร์เซ็นต์ (%)
                                        </label>
                                    </div>
                                )}

                                {effectTypes[newEffect.effectType].requiredFields.includes('targetStat') && (
                                    <div className="form-group">
                                        <label>สถานะที่ได้รับผล</label>
                                        <select
                                            value={newEffect.targetStat || ''}
                                            onChange={(e) => setNewEffect({...newEffect, targetStat: e.target.value})}
                                        >
                                            <option value="">-- เลือก --</option>
                                            <option value="hp">❤️ HP</option>
                                            <option value="attack">⚔️ Attack</option>
                                            <option value="defense">🛡️ Defense</option>
                                            <option value="speed">⚡ Speed</option>
                                            <option value="shield">🛡️ Shield</option>
                                        </select>
                                    </div>
                                )}

                                {effectTypes[newEffect.effectType].requiredFields.includes('modifierType') && (
                                    <div className="form-group">
                                        <label>วิธีการปรับค่า</label>
                                        <select
                                            value={newEffect.modifierType || ''}
                                            onChange={(e) => setNewEffect({...newEffect, modifierType: e.target.value})}
                                        >
                                            <option value="">-- เลือก --</option>
                                            <option value="add">➕ บวก/ลบ (Add/Subtract)</option>
                                            <option value="multiply">✖️ คูณ (Multiply)</option>
                                            <option value="set">📌 กำหนดค่า (Set)</option>
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>เวลาที่เกิดผล</label>
                                    <select
                                        value={newEffect.triggerTiming}
                                        onChange={(e) => setNewEffect({...newEffect, triggerTiming: e.target.value})}
                                    >
                                        <option value="turn_start">🔄 ต้นรอบ</option>
                                        <option value="turn_end">🔚 ปลายรอบ</option>
                                        <option value="on_hit">⚔️ เมื่อโจมตี</option>
                                        <option value="on_damaged">🩸 เมื่อถูกโจมตี</option>
                                        <option value="continuous">♾️ ต่อเนื่อง</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newEffect.stackable}
                                            onChange={(e) => setNewEffect({...newEffect, stackable: e.target.checked})}
                                        />
                                        {' '}สามารถซ้อนทับได้
                                    </label>
                                </div>

                                {newEffect.stackable && (
                                    <div className="form-group">
                                        <label>จำนวนซ้อนสูงสุด</label>
                                        <input
                                            type="number"
                                            value={newEffect.maxStacks}
                                            onChange={(e) => setNewEffect({...newEffect, maxStacks: parseInt(e.target.value)})}
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Preview */}
                            <div className="form-section">
                                <h4>👁️ ตัวอย่าง</h4>
                                <div className="effect-preview">
                                    <div className="effect-card">
                                        <div className="effect-header">
                                            <span className="effect-emoji" style={{ color: newEffect.color }}>
                                                {newEffect.emoji || '❓'}
                                            </span>
                                            <strong>{newEffect.name || 'ชื่อ Effect'}</strong>
                                        </div>
                                        <p className="effect-desc">{newEffect.description || 'คำอธิบายสั้น'}</p>
                                        <p className="effect-detail">{newEffect.effect || 'คำอธิบายเต็ม'}</p>
                                        <span className="effect-display-type">
                                            แสดงผล: {newEffect.displayType === 'icon' ? '🎨 ไอคอน' : newEffect.displayType === 'text' ? '📝 ข้อความ' : '🎨📝 ทั้งสอง'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => {
                                setShowCreateForm(false);
                                setEditingEffect(null);
                            }}>
                                ยกเลิก
                            </button>
                            <button className="btn-primary" onClick={handleCreateEffect}>
                                {editingEffect ? '💾 บันทึก' : '➕ สร้าง'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Effects List */}
            <div className="effects-list-container">
                <h3>📚 Status Effects ทั้งหมด ({Object.keys(effects).length})</h3>
                <div className="effects-grid">
                    {Object.values(effects).map(effect => (
                        <div key={effect.id} className="effect-item">
                            <div className="effect-item-header">
                                <span className="effect-emoji" style={{ color: effect.color }}>
                                    {effect.emoji}
                                </span>
                                <strong>{effect.name}</strong>
                            </div>
                            <p className="effect-desc">{effect.description}</p>
                            <p className="effect-detail">{effect.effect}</p>
                            {effect.logic && (
                                <div className="effect-logic-info">
                                    <small>
                                        📊 {effectTypes[effect.logic.effectType]?.name || effect.logic.effectType}
                                        {effect.logic.duration > 0 && ` | ⏱️ ${effect.logic.duration} รอบ`}
                                        {effect.logic.value !== 0 && ` | 💪 ${effect.logic.value}${effect.logic.percentage ? '%' : ''}`}
                                    </small>
                                </div>
                            )}
                            <div className="effect-item-actions">
                                <button className="btn-small btn-secondary" onClick={() => handleEditEffect(effect.id)}>
                                    ✏️ แก้ไข
                                </button>
                                <button className="btn-small btn-danger" onClick={() => handleDeleteEffect(effect.id)}>
                                    🗑️ ลบ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
