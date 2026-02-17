import React, { useState } from 'react';
import { STATUS_EFFECTS } from './gameData';

export default function CardGeneratorView({ characters, cards }) {
    const [showInstructions, setShowInstructions] = useState(true);
    const [showGenerator, setShowGenerator] = useState(false);

    const openCardGenerator = () => {
        // แสดง Card Generator ภายใน component นี้
        setShowGenerator(true);
    };

    // ถ้าแสดง Generator แล้ว ให้แสดงแบบ fullscreen
    if (showGenerator) {
        return (
            <div style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 20000,
                display: 'flex',
                flexDirection: 'column',
                background: '#1a1d29'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 20px',
                    background: 'rgba(0,0,0,0.8)',
                    borderBottom: '2px solid rgba(255,215,0,0.3)',
                    flexShrink: 0
                }}>
                    <h2 style={{ margin: 0, color: '#ffd700', fontSize: '1.3rem' }}>🎴 Card Generator</h2>
                    <button 
                        onClick={() => setShowGenerator(false)}
                        style={{ 
                            padding: '10px 24px',
                            background: 'rgba(255,77,77,0.2)',
                            border: '2px solid rgba(255,77,77,0.5)',
                            borderRadius: '8px',
                            color: '#ff4d4d',
                            cursor: 'pointer',
                            fontFamily: 'Kanit, sans-serif',
                            fontWeight: '700',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = '#ff4d4d';
                            e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(255,77,77,0.2)';
                            e.target.style.color = '#ff4d4d';
                        }}
                    >
                        ✕ ปิด
                    </button>
                </div>
                <iframe 
                    src="/card-generator-all.html"
                    style={{ 
                        flex: 1,
                        width: '100%',
                        border: 'none',
                        background: '#1a1d29'
                    }}
                    title="Card Generator"
                />
            </div>
        );
    }

    return (
        <div className="card-generator-view">
            <div className="view-header">
                <h2>🎴 สร้างการ์ดสำหรับพิมพ์</h2>
                <p>สร้างการ์ดตัวละครและสกิลสำหรับพิมพ์จริง (63mm x 88mm, 300 DPI)</p>
            </div>

            {showInstructions && (
                <div className="instructions-card">
                    <div className="instructions-header">
                        <h3>📖 คู่มือการใช้งาน</h3>
                        <button 
                            className="close-btn"
                            onClick={() => setShowInstructions(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="instructions-content">
                        <div className="instruction-section">
                            <h4>🎯 ฟีเจอร์หลัก</h4>
                            <ul>
                                <li>✅ สร้างการ์ดตัวละคร + สกิล 4 แบบพร้อมกัน</li>
                                <li>✅ อัปโหลดรูปภาพ (คลิกที่การ์ดเพื่อเลือกรูป)</li>
                                <li>✅ ปรับซูม/ตำแหน่งรูปตัวละคร</li>
                                <li>✅ ธาตุของสกิลจะตามธาตุตัวละครอัตโนมัติ</li>
                                <li>✅ ดาวน์โหลดเป็นไฟล์ PNG คุณภาพสูง (300 DPI)</li>
                            </ul>
                        </div>

                        <div className="instruction-section">
                            <h4>🎴 ประเภทการ์ด</h4>
                            <div className="card-types-grid">
                                <div className="card-type-item">
                                    <span className="card-type-icon">🔥</span>
                                    <strong>Ultimate (⚡3)</strong>
                                    <p>พลังสูงสุด ดาเมจ 180-220</p>
                                </div>
                                <div className="card-type-item">
                                    <span className="card-type-icon">⚔️</span>
                                    <strong>Normal (⚡1)</strong>
                                    <p>ใช้ทั่วไป ดาเมจ 50-100</p>
                                </div>
                                <div className="card-type-item">
                                    <span className="card-type-icon">💫</span>
                                    <strong>Passive (⚡0)</strong>
                                    <p>ติดตัวตลอด โบนัสต่อเนื่อง</p>
                                </div>
                                <div className="card-type-item">
                                    <span className="card-type-icon">💚</span>
                                    <strong>Support (⚡2)</strong>
                                    <p>รักษา/ซัพพอร์ต</p>
                                </div>
                            </div>
                        </div>

                        <div className="instruction-section">
                            <h4>✨ Status Effects ที่มี</h4>
                            <div className="status-effects-grid">
                                {Object.values(STATUS_EFFECTS).slice(0, 8).map(effect => (
                                    <div key={effect.id} className="status-effect-item">
                                        <span style={{ color: effect.color }}>{effect.emoji}</span>
                                        <span>{effect.name}</span>
                                    </div>
                                ))}
                                <div className="status-effect-item">
                                    <span>➕</span>
                                    <span>และอีก {Object.keys(STATUS_EFFECTS).length - 8} แบบ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="generator-actions">
                <button 
                    className="btn-primary btn-large"
                    onClick={openCardGenerator}
                >
                    🚀 เปิดเครื่องมือสร้างการ์ด
                </button>
                <p className="action-hint">
                    เครื่องมือจะแสดงในหน้านี้เลย ไม่ต้องเปิดแท็บใหม่
                </p>
                <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    background: 'rgba(72, 187, 120, 0.1)', 
                    borderRadius: '10px',
                    border: '2px solid rgba(72, 187, 120, 0.3)'
                }}>
                    <h4 style={{ color: '#48bb78', marginBottom: '10px', fontSize: '1rem' }}>
                        ✅ ขั้นตอนการใช้งาน
                    </h4>
                    <ol style={{ 
                        marginLeft: '20px', 
                        color: '#e0e0e0',
                        fontSize: '0.9rem',
                        lineHeight: '1.8'
                    }}>
                        <li>คลิกปุ่ม "🚀 เปิดเครื่องมือสร้างการ์ด" ด้านบน</li>
                        <li>ออกแบบการ์ดตัวละครและสกิลในหน้าเดียวกัน</li>
                        <li>คลิกปุ่ม "💾 บันทึกลงระบบ" เมื่อเสร็จแล้ว</li>
                        <li>คลิก "← กลับ" และไปที่แท็บ "👥 ตัวละคร" เพื่อดูตัวละครใหม่</li>
                    </ol>
                </div>
            </div>

            <div className="status-effects-reference">
                <h3>📚 รายการ Status Effects ทั้งหมด</h3>
                <p className="reference-desc">
                    คุณสามารถเพิ่ม Status Effects เหล่านี้ในสกิลของคุณได้
                </p>
                
                <div className="effects-categories">
                    <div className="effects-category">
                        <h4>🔴 Debuffs (สถานะผลเสีย)</h4>
                        <div className="effects-list">
                            {Object.values(STATUS_EFFECTS)
                                .filter(e => ['poison', 'stun', 'burn', 'freeze', 'bleed', 'heal_block', 'debuff_atk', 'debuff_def'].includes(e.id))
                                .map(effect => (
                                    <div key={effect.id} className="effect-card">
                                        <div className="effect-header">
                                            <span className="effect-emoji" style={{ color: effect.color }}>
                                                {effect.emoji}
                                            </span>
                                            <strong>{effect.name}</strong>
                                        </div>
                                        <p className="effect-desc">{effect.description}</p>
                                        <p className="effect-detail">{effect.effect}</p>
                                        <span className="effect-display-type">
                                            แสดงผล: {effect.displayType === 'icon' ? '🎨 ไอคอน' : effect.displayType === 'text' ? '📝 ข้อความ' : '🎨📝 ทั้งสอง'}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="effects-category">
                        <h4>🟢 Buffs (สถานะผลดี)</h4>
                        <div className="effects-list">
                            {Object.values(STATUS_EFFECTS)
                                .filter(e => ['buff_atk', 'buff_def', 'buff_spd', 'reflect', 'immunity', 'revive'].includes(e.id))
                                .map(effect => (
                                    <div key={effect.id} className="effect-card">
                                        <div className="effect-header">
                                            <span className="effect-emoji" style={{ color: effect.color }}>
                                                {effect.emoji}
                                            </span>
                                            <strong>{effect.name}</strong>
                                        </div>
                                        <p className="effect-desc">{effect.description}</p>
                                        <p className="effect-detail">{effect.effect}</p>
                                        <span className="effect-display-type">
                                            แสดงผล: {effect.displayType === 'icon' ? '🎨 ไอคอน' : effect.displayType === 'text' ? '📝 ข้อความ' : '🎨📝 ทั้งสอง'}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="effects-category">
                        <h4>🟡 Special (พิเศษ)</h4>
                        <div className="effects-list">
                            {Object.values(STATUS_EFFECTS)
                                .filter(e => ['shield_break', 'taunt', 'lifesteal', 'cleanse'].includes(e.id))
                                .map(effect => (
                                    <div key={effect.id} className="effect-card">
                                        <div className="effect-header">
                                            <span className="effect-emoji" style={{ color: effect.color }}>
                                                {effect.emoji}
                                            </span>
                                            <strong>{effect.name}</strong>
                                        </div>
                                        <p className="effect-desc">{effect.description}</p>
                                        <p className="effect-detail">{effect.effect}</p>
                                        <span className="effect-display-type">
                                            แสดงผล: {effect.displayType === 'icon' ? '🎨 ไอคอน' : effect.displayType === 'text' ? '📝 ข้อความ' : '🎨📝 ทั้งสอง'}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="tips-section">
                <h3>💡 เคล็ดลับการออกแบบการ์ด</h3>
                <div className="tips-grid">
                    <div className="tip-card">
                        <span className="tip-icon">🎨</span>
                        <h4>เลือกรูปที่เหมาะสม</h4>
                        <p>ใช้รูปความละเอียดสูง อย่างน้อย 744x1039 px เพื่อคุณภาพการพิมพ์ที่ดี</p>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">⚖️</span>
                        <h4>สมดุลของสกิล</h4>
                        <p>Ultimate ควรมีดาเมจ 180-220, Normal 50-100, Passive ให้โบนัสต่อเนื่อง</p>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">📝</span>
                        <h4>คำอธิบายกระชับ</h4>
                        <p>จำกัด 30 ตัวอักษร ใช้ภาษาที่เข้าใจง่าย ชัดเจน</p>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">🎯</span>
                        <h4>เลือก Status Effect</h4>
                        <p>เพิ่มความหลากหลายด้วย Status Effects ที่เหมาะกับธาตุและบทบาท</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
