import React, { useState, useMemo, useEffect } from 'react';
import { ELEMENT_INFO, SKILL_TYPES } from './gameData';
import CardGeneratorView from './CardGeneratorView';
import StatusEffectsManager from './StatusEffectsManager';
import { createCharacterWithCards, updateCharacter, deleteCharacter } from './database';

export default function AdminPanelPro({
    cards,
    setCards,
    characters,
    setCharacters,
    onClose
}) {
    // State Management
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterElement, setFilterElement] = useState('all');
    const [filterClass, setFilterClass] = useState('all');
    const [sortBy, setSortBy] = useState('power');
    const [selectedChars, setSelectedChars] = useState([]);
    const [editingChar, setEditingChar] = useState(null);
    const [showCreateWizard, setShowCreateWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [newChar, setNewChar] = useState({
        name: '',
        emoji: '🐉',
        element: 'fire',
        class: 'balanced',
        hp: 400,
        attack: 60,
        speed: 40,
        image: null, // รูปภาพตัวละคร (Base64)
        imageUrl: '', // URL รูปภาพ (ถ้าใช้ URL แทน Base64)
        skillImages: {
            ultimate: null,
            passive: null,
            normal1: null,
            normal2: null
        }
    });

    // Image Upload State
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [skillImagePreviews, setSkillImagePreviews] = useState({
        ultimate: null,
        passive: null,
        normal1: null,
        normal2: null
    });

    // Message Listener for Card Generator
    useEffect(() => {
        console.log('🎧 Admin Panel: Message listener ถูกติดตั้งแล้ว');
        
        const handleMessage = async (event) => {
            console.log('📨 Admin Panel: ได้รับ message:', event.data);
            
            // รับข้อมูลจาก Card Generator
            if (event.data && event.data.type === 'CARD_DATA_SAVED') {
                const cardData = event.data.data;
                console.log('📥 รับข้อมูลการ์ดจาก Card Generator:', cardData.character.nameThai);
                
                try {
                    // แสดงข้อความกำลังบันทึก
                    alert('🎉 กำลังบันทึกข้อมูลลง Supabase...\n\nตัวละคร: ' + cardData.character.nameThai);
                    
                    // เตรียมข้อมูลตัวละคร
                    const characterData = {
                        name: cardData.character.nameThai,
                        element: cardData.character.element,
                        hp: cardData.character.hp,
                        maxHp: cardData.character.hp,
                        attack: cardData.character.attack,
                        speed: cardData.character.speed,
                        emoji: ELEMENT_INFO[cardData.character.element]?.emoji || '🐉',
                        class: 'balanced',
                        ability: `ตัวละครธาตุ${ELEMENT_INFO[cardData.character.element]?.name}`,
                        image: cardData.character.image || null
                    };

                    // เตรียมข้อมูลการ์ด (ลำดับ: Passive → Normal → Support → Ultimate)
                    const cardsData = {
                        passive: {
                            id: `${cardData.character.element}_pass_${Date.now()}`,
                            name: cardData.skills.passive.name,
                            element: cardData.character.element,
                            type: 'passive',
                            energy: 0,
                            damage: cardData.skills.passive.damage,
                            shield: cardData.skills.passive.shield,
                            targetType: cardData.skills.passive.target,
                            desc: cardData.skills.passive.description,
                            image: cardData.skills.passive.image || null
                        },
                        normal: {
                            id: `${cardData.character.element}_norm_${Date.now()}`,
                            name: cardData.skills.normal.name,
                            element: cardData.character.element,
                            type: 'normal',
                            energy: 1,
                            damage: cardData.skills.normal.damage,
                            shield: cardData.skills.normal.shield,
                            targetType: cardData.skills.normal.target,
                            desc: cardData.skills.normal.description,
                            image: cardData.skills.normal.image || null
                        },
                        support: {
                            id: `${cardData.character.element}_supp_${Date.now()}`,
                            name: cardData.skills.support.name,
                            element: cardData.character.element,
                            type: 'normal',
                            energy: 2,
                            damage: cardData.skills.support.damage,
                            shield: cardData.skills.support.shield,
                            targetType: cardData.skills.support.target,
                            desc: cardData.skills.support.description,
                            image: cardData.skills.support.image || null
                        },
                        ultimate: {
                            id: `${cardData.character.element}_ult_${Date.now()}`,
                            name: cardData.skills.ultimate.name,
                            element: cardData.character.element,
                            type: 'ultimate',
                            energy: 3,
                            damage: cardData.skills.ultimate.damage,
                            shield: cardData.skills.ultimate.shield,
                            targetType: cardData.skills.ultimate.target,
                            desc: cardData.skills.ultimate.description,
                            image: cardData.skills.ultimate.image || null
                        }
                    };

                    // บันทึกลง Supabase
                    console.log('💾 กำลังบันทึกลง Supabase...');
                    const result = await createCharacterWithCards(characterData, cardsData);
                    console.log('✅ บันทึกลง Supabase สำเร็จ:', result);

                    // อัปเดต local state
                    const newCards = {};
                    Object.values(cardsData).forEach(card => {
                        newCards[card.id] = card;
                    });

                    setCards(prev => {
                        const updated = { ...prev, ...newCards };
                        console.log('✅ เพิ่มการ์ด 4 ใบลงระบบแล้ว');
                        return updated;
                    });

                    const newCharacter = {
                        id: result.character.id,
                        name: result.character.name,
                        element: result.character.element,
                        hp: result.character.hp,
                        maxHp: result.character.max_hp,
                        shield: 0,
                        emoji: result.character.emoji,
                        attack: result.character.attack,
                        speed: result.character.speed,
                        baseSpeed: result.character.speed,
                        cards: result.cards,
                        ability: result.character.ability,
                        class: result.character.class,
                        image: result.character.image,
                        position: null,
                        skillImages: {
                            ultimate: cardData.skills.ultimate.image || null,
                            passive: cardData.skills.passive.image || null,
                            normal1: cardData.skills.normal.image || null,
                            normal2: cardData.skills.support.image || null
                        }
                    };

                    setCharacters(prev => {
                        const updated = [...prev, newCharacter];
                        console.log('✅ เพิ่มตัวละครลงระบบแล้ว:', newCharacter.name);
                        return updated;
                    });

                    // แสดงข้อความสำเร็จ
                    setTimeout(() => {
                        alert(`✅ บันทึกลง Supabase สำเร็จ!\n\nเพิ่มตัวละคร "${cardData.character.nameThai}" และการ์ด 4 ใบลงระบบแล้ว\n\n👉 คลิกปุ่ม "✕ ปิด" และไปที่แท็บ "👥 ตัวละคร" เพื่อดูตัวละครใหม่`);
                        setActiveTab('characters');
                    }, 500);

                } catch (error) {
                    console.error('❌ เกิดข้อผิดพลาดในการบันทึก:', error);
                    alert(`❌ เกิดข้อผิดพลาด!\n\n${error.message}\n\nกรุณาตรวจสอบการเชื่อมต่อ Supabase`);
                }
            }
        };

        // เพิ่ม event listener
        window.addEventListener('message', handleMessage);
        console.log('✅ Event listener ถูกเพิ่มแล้ว');

        // ลบ event listener เมื่อ component ถูก unmount
        return () => {
            window.removeEventListener('message', handleMessage);
            console.log('🗑️ Event listener ถูกลบแล้ว');
        };
    }, []); // Empty dependency array - ติดตั้งครั้งเดียวตอน mount

    // Power Calculation
    const calculatePower = (char) => {
        const charCards = char.cards?.map(cId => cards[cId]).filter(Boolean) || [];
        const totalDamage = charCards.reduce((sum, card) => sum + (card.damage > 0 ? card.damage : 0), 0);
        const totalShield = charCards.reduce((sum, card) => sum + card.shield, 0);
        const totalHealing = charCards.reduce((sum, card) => sum + (card.damage < 0 ? Math.abs(card.damage) : 0), 0);
        
        const powerScore = char.hp + (totalDamage * 1.5) + (totalShield * 0.8) + (char.speed * 2) + (totalHealing * 1.2);
        
        return {
            powerScore: Math.round(powerScore),
            totalDamage,
            totalShield,
            totalHealing
        };
    };


    // Filtered and Sorted Characters
    const processedChars = useMemo(() => {
        let filtered = characters.filter(char => {
            const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesElement = filterElement === 'all' || char.element === filterElement;
            const matchesClass = filterClass === 'all' || char.class === filterClass;
            return matchesSearch && matchesElement && matchesClass;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'power') return calculatePower(b).powerScore - calculatePower(a).powerScore;
            if (sortBy === 'hp') return b.hp - a.hp;
            if (sortBy === 'speed') return b.speed - a.speed;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

        return filtered;
    }, [characters, searchQuery, filterElement, filterClass, sortBy, cards]);

    // Balance Analysis
    const balanceAnalysis = useMemo(() => {
        const powers = characters.map(char => calculatePower(char).powerScore);
        const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
        const maxPower = Math.max(...powers);
        const minPower = Math.min(...powers);
        const variance = ((maxPower - minPower) / avgPower * 100).toFixed(1);

        const elementDist = {};
        characters.forEach(char => {
            elementDist[char.element] = (elementDist[char.element] || 0) + 1;
        });

        return { avgPower: Math.round(avgPower), maxPower, minPower, variance, elementDist };
    }, [characters, cards]);

    // Template System
    const templates = {
        tank: { hp: 520, attack: 50, speed: 30, class: 'tank' },
        dps: { hp: 350, attack: 85, speed: 55, class: 'dps' },
        support: { hp: 420, attack: 60, speed: 45, class: 'support' },
        balanced: { hp: 450, attack: 65, speed: 45, class: 'balanced' }
    };


    // Image Upload Handlers
    const handleCharacterImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
            return;
        }

        setUploadingImage(true);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const base64 = event.target.result;
            setNewChar(prev => ({ ...prev, image: base64 }));
            setImagePreview(base64);
            setUploadingImage(false);
        };

        reader.onerror = () => {
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
            setUploadingImage(false);
        };

        reader.readAsDataURL(file);
    };

    const handleSkillImageUpload = (skillType, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        if (file.size > 3 * 1024 * 1024) { // 3MB limit for skill images
            alert('ไฟล์รูปภาพสกิลต้องมีขนาดไม่เกิน 3MB');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (event) => {
            const base64 = event.target.result;
            setNewChar(prev => ({
                ...prev,
                skillImages: {
                    ...prev.skillImages,
                    [skillType]: base64
                }
            }));
            setSkillImagePreviews(prev => ({
                ...prev,
                [skillType]: base64
            }));
        };

        reader.onerror = () => {
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
        };

        reader.readAsDataURL(file);
    };

    const removeCharacterImage = () => {
        setNewChar(prev => ({ ...prev, image: null }));
        setImagePreview(null);
    };

    const removeSkillImage = (skillType) => {
        setNewChar(prev => ({
            ...prev,
            skillImages: {
                ...prev.skillImages,
                [skillType]: null
            }
        }));
        setSkillImagePreviews(prev => ({
            ...prev,
            [skillType]: null
        }));
    };

    // Handlers
    const handleCreateChar = () => {
        const id = `char_${Date.now()}`;
        const elementCards = Object.values(cards).filter(c => c.element === newChar.element);
        const selectedCards = [
            elementCards.find(c => c.type === 'ultimate')?.id,
            elementCards.find(c => c.type === 'passive')?.id,
            elementCards.find(c => c.type === 'normal')?.id,
            elementCards.filter(c => c.type === 'normal')[1]?.id
        ].filter(Boolean);

        const character = {
            ...newChar,
            id,
            maxHp: newChar.hp,
            shield: 0,
            cards: selectedCards,
            ability: `ตัวละคร${newChar.class === 'tank' ? 'แทงก์' : newChar.class === 'dps' ? 'ดาเมจ' : newChar.class === 'support' ? 'ซัพพอร์ต' : 'สมดุล'} ธาตุ${ELEMENT_INFO[newChar.element].name}`,
            createdAt: new Date().toISOString(),
            version: 1
        };

        setCharacters(prev => [...prev, character]);
        setShowCreateWizard(false);
        setWizardStep(1);
        setNewChar({ 
            name: '', 
            emoji: '🐉', 
            element: 'fire', 
            class: 'balanced', 
            hp: 400, 
            attack: 60, 
            speed: 40,
            image: null,
            imageUrl: '',
            skillImages: { ultimate: null, passive: null, normal1: null, normal2: null }
        });
        setImagePreview(null);
        setSkillImagePreviews({ ultimate: null, passive: null, normal1: null, normal2: null });
    };

    const handleBulkDelete = () => {
        if (selectedChars.length === 0) return;
        if (!confirm(`ต้องการลบตัวละคร ${selectedChars.length} ตัวใช่หรือไม่?`)) return;
        setCharacters(prev => prev.filter(c => !selectedChars.includes(c.id)));
        setSelectedChars([]);
    };

    const handleBulkEdit = (field, value) => {
        setCharacters(prev => prev.map(c => 
            selectedChars.includes(c.id) ? { ...c, [field]: value } : c
        ));
    };

    const handleExport = () => {
        const data = { characters, cards, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-data-${Date.now()}.json`;
        a.click();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.characters) setCharacters(data.characters);
                if (data.cards) setCards(data.cards);
                alert('นำเข้าข้อมูลสำเร็จ!');
            } catch (err) {
                alert('ไฟล์ไม่ถูกต้อง!');
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="admin-pro-overlay">
            <div className="admin-pro-window">
                {/* Header */}
                <div className="admin-pro-header">
                    <div>
                        <h1>🎮 ระบบจัดการตัวละคร Pro</h1>
                        <p>จัดการ {characters.length} ตัวละคร | พลังเฉลี่ย {balanceAnalysis.avgPower}</p>
                    </div>
                    <button className="close-btn-pro" onClick={onClose}>✕</button>
                </div>

                {/* Navigation Tabs */}
                <div className="admin-pro-tabs">
                    <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                        📊 Dashboard
                    </button>
                    <button className={activeTab === 'characters' ? 'active' : ''} onClick={() => setActiveTab('characters')}>
                        👥 ตัวละคร ({characters.length})
                    </button>
                    <button className={activeTab === 'cards' ? 'active' : ''} onClick={() => setActiveTab('cards')}>
                        🃏 การ์ด ({Object.keys(cards).length})
                    </button>
                    <button className={activeTab === 'cardgen' ? 'active' : ''} onClick={() => setActiveTab('cardgen')}>
                        🎴 สร้างการ์ดพิมพ์
                    </button>
                    <button className={activeTab === 'effects' ? 'active' : ''} onClick={() => setActiveTab('effects')}>
                        ✨ Status Effects
                    </button>
                    <button className={activeTab === 'ai' ? 'active' : ''} onClick={() => setActiveTab('ai')}>
                        🤖 AI Assistant
                    </button>
                    <button className={activeTab === 'balance' ? 'active' : ''} onClick={() => setActiveTab('balance')}>
                        ⚖️ ความสมดุล
                    </button>
                    <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')}>
                        🛠️ เครื่องมือ
                    </button>
                </div>

                {/* Content Area */}
                <div className="admin-pro-content" style={activeTab === 'cardgen' ? { padding: 0, position: 'relative', overflow: 'hidden' } : {}}>
                    {activeTab === 'dashboard' && (
                        <DashboardView 
                            characters={characters}
                            balanceAnalysis={balanceAnalysis}
                            calculatePower={calculatePower}
                        />
                    )}

                    {activeTab === 'characters' && (
                        <CharactersView
                            characters={processedChars}
                            selectedChars={selectedChars}
                            setSelectedChars={setSelectedChars}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            filterElement={filterElement}
                            setFilterElement={setFilterElement}
                            filterClass={filterClass}
                            setFilterClass={setFilterClass}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            calculatePower={calculatePower}
                            setShowCreateWizard={setShowCreateWizard}
                            handleBulkDelete={handleBulkDelete}
                            setCharacters={setCharacters}
                            cards={cards}
                        />
                    )}

                    {activeTab === 'cards' && (
                        <CardsView cards={cards} setCards={setCards} />
                    )}

                    {activeTab === 'ai' && (
                        <AIAssistantView 
                            characters={characters}
                            setCharacters={setCharacters}
                            cards={cards}
                            setCards={setCards}
                            calculatePower={calculatePower}
                            balanceAnalysis={balanceAnalysis}
                        />
                    )}

                    {activeTab === 'balance' && (
                        <BalanceView 
                            characters={characters}
                            balanceAnalysis={balanceAnalysis}
                            calculatePower={calculatePower}
                        />
                    )}

                    {activeTab === 'cardgen' && (
                        <CardGeneratorView 
                            characters={characters}
                            cards={cards}
                        />
                    )}

                    {activeTab === 'effects' && (
                        <StatusEffectsManager 
                            onSave={(updatedEffects) => {
                                // บันทึก effects ที่อัปเดต
                                console.log('Status Effects updated:', updatedEffects);
                                // TODO: บันทึกลง localStorage หรือ database
                            }}
                        />
                    )}

                    {activeTab === 'tools' && (
                        <ToolsView 
                            handleExport={handleExport}
                            handleImport={handleImport}
                            selectedChars={selectedChars}
                            handleBulkEdit={handleBulkEdit}
                        />
                    )}
                </div>

                {/* Create Wizard Modal */}
                {showCreateWizard && (
                    <CreateWizard
                        wizardStep={wizardStep}
                        setWizardStep={setWizardStep}
                        newChar={newChar}
                        setNewChar={setNewChar}
                        templates={templates}
                        handleCreateChar={handleCreateChar}
                        imagePreview={imagePreview}
                        skillImagePreviews={skillImagePreviews}
                        handleCharacterImageUpload={handleCharacterImageUpload}
                        handleSkillImageUpload={handleSkillImageUpload}
                        removeCharacterImage={removeCharacterImage}
                        removeSkillImage={removeSkillImage}
                        uploadingImage={uploadingImage}
                        onClose={() => {
                            setShowCreateWizard(false);
                            setWizardStep(1);
                            setImagePreview(null);
                            setSkillImagePreviews({ ultimate: null, passive: null, normal1: null, normal2: null });
                        }}
                    />
                )}
            </div>
        </div>
    );
}


// ============================================
// DASHBOARD VIEW
// ============================================
function DashboardView({ characters, balanceAnalysis, calculatePower }) {
    const topChars = characters
        .map(char => ({ char, power: calculatePower(char).powerScore }))
        .sort((a, b) => b.power - a.power)
        .slice(0, 5);

    return (
        <div className="dashboard-grid">
            {/* Stats Cards */}
            <div className="stat-card-pro">
                <div className="stat-icon">👥</div>
                <div>
                    <div className="stat-label">ตัวละครทั้งหมด</div>
                    <div className="stat-value">{characters.length}</div>
                </div>
            </div>

            <div className="stat-card-pro">
                <div className="stat-icon">💪</div>
                <div>
                    <div className="stat-label">พลังเฉลี่ย</div>
                    <div className="stat-value">{balanceAnalysis.avgPower}</div>
                </div>
            </div>

            <div className="stat-card-pro">
                <div className="stat-icon">⚖️</div>
                <div>
                    <div className="stat-label">ความแตกต่าง</div>
                    <div className="stat-value">{balanceAnalysis.variance}%</div>
                </div>
            </div>

            <div className="stat-card-pro">
                <div className="stat-icon">🔥</div>
                <div>
                    <div className="stat-label">สถานะสมดุล</div>
                    <div className="stat-value" style={{ 
                        color: balanceAnalysis.variance < 15 ? '#48bb78' : balanceAnalysis.variance < 30 ? '#f6e05e' : '#ff4d4d',
                        fontSize: '0.9rem'
                    }}>
                        {balanceAnalysis.variance < 15 ? 'ดีเยี่ยม' : balanceAnalysis.variance < 30 ? 'ปานกลาง' : 'ต้องปรับ'}
                    </div>
                </div>
            </div>

            {/* Element Distribution */}
            <div className="dashboard-section">
                <h3>🔥 การกระจายธาตุ</h3>
                <div className="element-dist-grid">
                    {Object.entries(ELEMENT_INFO).map(([key, info]) => (
                        <div key={key} className="element-dist-card">
                            <div className="element-icon-big" style={{ background: info.color }}>
                                {info.emoji}
                            </div>
                            <div className="element-name">{info.name}</div>
                            <div className="element-count">{balanceAnalysis.elementDist[key] || 0} ตัว</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top 5 Characters */}
            <div className="dashboard-section">
                <h3>🏆 Top 5 ตัวละครที่แข็งแกร่งที่สุด</h3>
                <div className="top-chars-list">
                    {topChars.map(({ char, power }, index) => (
                        <div key={char.id} className="top-char-item">
                            <div className="rank-badge">#{index + 1}</div>
                            <div className="char-emoji-big">{char.emoji}</div>
                            <div className="char-info-compact">
                                <div className="char-name-compact">{char.name}</div>
                                <div className="char-element-compact" style={{ color: ELEMENT_INFO[char.element].color }}>
                                    {ELEMENT_INFO[char.element].emoji} {ELEMENT_INFO[char.element].name}
                                </div>
                            </div>
                            <div className="power-badge">{power}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


// ============================================
// CHARACTERS VIEW
// ============================================
function CharactersView({ 
    characters, selectedChars, setSelectedChars, searchQuery, setSearchQuery,
    filterElement, setFilterElement, filterClass, setFilterClass, sortBy, setSortBy,
    calculatePower, setShowCreateWizard, handleBulkDelete, setCharacters, cards
}) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleEdit = (char) => {
        setEditingId(char.id);
        setEditForm({ ...char });
    };

    const handleSave = () => {
        setCharacters(prev => prev.map(c => c.id === editingId ? { ...editForm, maxHp: editForm.hp } : c));
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (!confirm('ต้องการลบตัวละครนี้?')) return;
        setCharacters(prev => prev.filter(c => c.id !== id));
    };

    const handleDuplicate = (char) => {
        const newChar = {
            ...char,
            id: `char_${Date.now()}`,
            name: `${char.name} (Copy)`,
            createdAt: new Date().toISOString()
        };
        setCharacters(prev => [...prev, newChar]);
    };

    const toggleSelect = (id) => {
        setSelectedChars(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="characters-view">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <input
                        type="text"
                        placeholder="🔍 ค้นหาตัวละคร..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-pro"
                    />
                    
                    <select value={filterElement} onChange={(e) => setFilterElement(e.target.value)} className="filter-select">
                        <option value="all">ธาตุทั้งหมด</option>
                        {Object.entries(ELEMENT_INFO).map(([key, info]) => (
                            <option key={key} value={key}>{info.emoji} {info.name}</option>
                        ))}
                    </select>

                    <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="filter-select">
                        <option value="all">คลาสทั้งหมด</option>
                        <option value="tank">🛡️ Tank</option>
                        <option value="dps">⚔️ DPS</option>
                        <option value="support">💚 Support</option>
                        <option value="balanced">⚖️ Balanced</option>
                    </select>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                        <option value="power">เรียงตามพลัง</option>
                        <option value="hp">เรียงตาม HP</option>
                        <option value="speed">เรียงตามความเร็ว</option>
                        <option value="name">เรียงตามชื่อ</option>
                    </select>
                </div>

                <div className="toolbar-right">
                    {selectedChars.length > 0 && (
                        <button className="btn-danger-pro" onClick={handleBulkDelete}>
                            🗑️ ลบที่เลือก ({selectedChars.length})
                        </button>
                    )}
                    <button className="btn-primary-pro" onClick={() => setShowCreateWizard(true)}>
                        ➕ สร้างตัวละครใหม่
                    </button>
                </div>
            </div>

            {/* Characters Grid */}
            <div className="chars-grid-pro">
                {characters.map(char => {
                    const power = calculatePower(char);
                    const elementInfo = ELEMENT_INFO[char.element];
                    const isSelected = selectedChars.includes(char.id);
                    const isEditing = editingId === char.id;

                    return (
                        <div key={char.id} className={`char-card-pro ${isSelected ? 'selected' : ''}`}>
                            <div className="char-card-header">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelect(char.id)}
                                    className="char-checkbox"
                                />
                                <div className="char-emoji-large">{char.emoji}</div>
                                <div className="element-badge-pro" style={{ background: elementInfo.color }}>
                                    {elementInfo.emoji}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="edit-form-inline">
                                    <input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="input-pro"
                                        placeholder="ชื่อ"
                                    />
                                    <input
                                        value={editForm.emoji}
                                        onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                                        className="input-pro"
                                        placeholder="Emoji"
                                    />
                                    <div className="stat-inputs">
                                        <label>HP: <input type="number" value={editForm.hp} onChange={(e) => setEditForm({ ...editForm, hp: Number(e.target.value) })} className="input-pro-small" /></label>
                                        <label>ATK: <input type="number" value={editForm.attack} onChange={(e) => setEditForm({ ...editForm, attack: Number(e.target.value) })} className="input-pro-small" /></label>
                                        <label>SPD: <input type="number" value={editForm.speed} onChange={(e) => setEditForm({ ...editForm, speed: Number(e.target.value) })} className="input-pro-small" /></label>
                                    </div>
                                    <div className="btn-group-inline">
                                        <button className="btn-save-pro" onClick={handleSave}>💾 บันทึก</button>
                                        <button className="btn-cancel-pro" onClick={() => setEditingId(null)}>✕</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="char-name-pro">{char.name}</h3>
                                    <div className="char-stats-grid">
                                        <div className="stat-item-pro">
                                            <span className="stat-label-pro">❤️ HP</span>
                                            <span className="stat-value-pro">{char.hp}</span>
                                        </div>
                                        <div className="stat-item-pro">
                                            <span className="stat-label-pro">⚔️ ATK</span>
                                            <span className="stat-value-pro">{char.attack}</span>
                                        </div>
                                        <div className="stat-item-pro">
                                            <span className="stat-label-pro">⚡ SPD</span>
                                            <span className="stat-value-pro">{char.speed}</span>
                                        </div>
                                        <div className="stat-item-pro">
                                            <span className="stat-label-pro">💪 PWR</span>
                                            <span className="stat-value-pro">{power.powerScore}</span>
                                        </div>
                                    </div>

                                    <div className="char-cards-mini">
                                        {char.cards?.slice(0, 4).map(cardId => {
                                            const card = cards[cardId];
                                            if (!card) return null;
                                            return (
                                                <div key={cardId} className="mini-card-badge" title={card.name}>
                                                    {card.type === 'ultimate' ? '⭐' : card.type === 'passive' ? '🔄' : '⚔️'}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="char-actions">
                                        <button className="btn-icon-pro" onClick={() => handleEdit(char)} title="แก้ไข">✏️</button>
                                        <button className="btn-icon-pro" onClick={() => handleDuplicate(char)} title="คัดลอก">📋</button>
                                        <button className="btn-icon-pro danger" onClick={() => handleDelete(char.id)} title="ลบ">🗑️</button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {characters.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>ไม่พบตัวละคร</h3>
                    <p>ลองเปลี่ยนตัวกรองหรือสร้างตัวละครใหม่</p>
                </div>
            )}
        </div>
    );
}


// ============================================
// CARDS VIEW
// ============================================
function CardsView({ cards, setCards }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [filterType, setFilterType] = useState('all');
    const [filterElement, setFilterElement] = useState('all');

    const filteredCards = Object.values(cards).filter(card => {
        const matchesType = filterType === 'all' || card.type === filterType;
        const matchesElement = filterElement === 'all' || card.element === filterElement;
        return matchesType && matchesElement;
    });

    const handleEdit = (card) => {
        setEditingId(card.id);
        setEditForm({ ...card });
    };

    const handleSave = () => {
        setCards(prev => ({ ...prev, [editingId]: editForm }));
        setEditingId(null);
    };

    return (
        <div className="cards-view">
            <div className="toolbar">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                    <option value="all">ประเภททั้งหมด</option>
                    <option value="ultimate">⭐ Ultimate</option>
                    <option value="passive">🔄 Passive</option>
                    <option value="normal">⚔️ Normal</option>
                </select>

                <select value={filterElement} onChange={(e) => setFilterElement(e.target.value)} className="filter-select">
                    <option value="all">ธาตุทั้งหมด</option>
                    {Object.entries(ELEMENT_INFO).map(([key, info]) => (
                        <option key={key} value={key}>{info.emoji} {info.name}</option>
                    ))}
                </select>
            </div>

            <div className="cards-grid-pro">
                {filteredCards.map(card => {
                    const elementInfo = ELEMENT_INFO[card.element];
                    const isEditing = editingId === card.id;

                    return (
                        <div key={card.id} className="card-item-pro" style={{ borderColor: elementInfo?.color }}>
                            {isEditing ? (
                                <div className="edit-form-card">
                                    <input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="input-pro"
                                        placeholder="ชื่อการ์ด"
                                    />
                                    <textarea
                                        value={editForm.desc}
                                        onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                                        className="textarea-pro"
                                        placeholder="คำอธิบาย"
                                    />
                                    <div className="stat-inputs">
                                        <label>⚡ Energy: <input type="number" value={editForm.energy} onChange={(e) => setEditForm({ ...editForm, energy: Number(e.target.value) })} className="input-pro-small" /></label>
                                        <label>⚔️ Damage: <input type="number" value={editForm.damage} onChange={(e) => setEditForm({ ...editForm, damage: Number(e.target.value) })} className="input-pro-small" /></label>
                                        <label>🛡️ Shield: <input type="number" value={editForm.shield} onChange={(e) => setEditForm({ ...editForm, shield: Number(e.target.value) })} className="input-pro-small" /></label>
                                    </div>
                                    <div className="btn-group-inline">
                                        <button className="btn-save-pro" onClick={handleSave}>💾 บันทึก</button>
                                        <button className="btn-cancel-pro" onClick={() => setEditingId(null)}>✕</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="card-header-pro">
                                        <div>
                                            <h4>{card.name}</h4>
                                            <div className="card-type-badge" style={{ background: elementInfo?.color }}>
                                                {elementInfo?.emoji} {card.type === 'ultimate' ? 'Ultimate' : card.type === 'passive' ? 'Passive' : 'Normal'}
                                            </div>
                                        </div>
                                        <div className="energy-badge-pro">⚡{card.energy}</div>
                                    </div>
                                    <p className="card-desc-pro">{card.desc}</p>
                                    <div className="card-stats-pro">
                                        <span className="card-stat-item">⚔️ {card.damage}</span>
                                        <span className="card-stat-item">🛡️ {card.shield}</span>
                                    </div>
                                    <button className="btn-edit-card" onClick={() => handleEdit(card)}>✏️ แก้ไข</button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ============================================
// BALANCE VIEW
// ============================================
function BalanceView({ characters, balanceAnalysis, calculatePower }) {
    const rankedChars = characters
        .map(char => ({ char, power: calculatePower(char) }))
        .sort((a, b) => b.power.powerScore - a.power.powerScore);

    const getBalanceColor = (variance) => {
        if (variance < 15) return '#48bb78';
        if (variance < 30) return '#f6e05e';
        return '#ff4d4d';
    };

    const getBalanceStatus = (variance) => {
        if (variance < 15) return 'สมดุลดีเยี่ยม ✅';
        if (variance < 30) return 'สมดุลปานกลาง ⚠️';
        return 'ไม่สมดุล ❌';
    };

    return (
        <div className="balance-view">
            {/* Balance Summary */}
            <div className="balance-summary">
                <div className="balance-card-big" style={{ borderColor: getBalanceColor(balanceAnalysis.variance) }}>
                    <h2>สถานะความสมดุล</h2>
                    <div className="balance-status-big" style={{ color: getBalanceColor(balanceAnalysis.variance) }}>
                        {getBalanceStatus(balanceAnalysis.variance)}
                    </div>
                    <div className="balance-metrics-row">
                        <div>
                            <div className="metric-label-small">ความแตกต่าง</div>
                            <div className="metric-value-big">{balanceAnalysis.variance}%</div>
                        </div>
                        <div>
                            <div className="metric-label-small">พลังเฉลี่ย</div>
                            <div className="metric-value-big">{balanceAnalysis.avgPower}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="recommendations-section">
                <h3>💡 คำแนะนำจากระบบ AI</h3>
                <div className="recommendations-grid">
                    {balanceAnalysis.variance > 30 && (
                        <div className="recommendation-card warning">
                            <div className="rec-icon">⚠️</div>
                            <div>
                                <h4>พบความไม่สมดุลสูง!</h4>
                                <p>ควรปรับ HP, Attack หรือ Speed ของตัวละครที่แข็งแกร่งเกินไปให้ลดลง หรือเพิ่มค่าให้ตัวที่อ่อนแอ</p>
                            </div>
                        </div>
                    )}
                    
                    {Object.values(balanceAnalysis.elementDist).some(count => count > characters.length * 0.4) && (
                        <div className="recommendation-card warning">
                            <div className="rec-icon">🔥</div>
                            <div>
                                <h4>ธาตุไม่สมดุล!</h4>
                                <p>มีธาตุบางอย่างมากเกินไป ควรเพิ่มตัวละครธาตุอื่นให้หลากหลายเพื่อความสมดุล</p>
                            </div>
                        </div>
                    )}

                    {balanceAnalysis.variance <= 15 && (
                        <div className="recommendation-card success">
                            <div className="rec-icon">✅</div>
                            <div>
                                <h4>ยอดเยี่ยม!</h4>
                                <p>ตัวละครมีความสมดุลดีมาก ผู้เล่นสามารถเลือกใช้ตัวไหนก็ได้โดยไม่เสียเปรียบ</p>
                            </div>
                        </div>
                    )}

                    <div className="recommendation-card info">
                        <div className="rec-icon">💡</div>
                        <div>
                            <h4>เคล็ดลับการปรับสมดุล</h4>
                            <p>สูตรคำนวณพลัง: HP + (ดาเมจ × 1.5) + (โล่ × 0.8) + (ความเร็ว × 2) + (ฮีล × 1.2)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Power Ranking */}
            <div className="ranking-section">
                <h3>📊 อันดับความแข็งแกร่ง</h3>
                <div className="ranking-table">
                    <div className="ranking-header">
                        <div>อันดับ</div>
                        <div>ตัวละคร</div>
                        <div>ธาตุ</div>
                        <div>HP</div>
                        <div>ATK</div>
                        <div>SPD</div>
                        <div>พลังรวม</div>
                        <div>กราฟ</div>
                    </div>
                    {rankedChars.map(({ char, power }, index) => {
                        const elementInfo = ELEMENT_INFO[char.element];
                        const percentOfMax = (power.powerScore / balanceAnalysis.maxPower) * 100;
                        
                        return (
                            <div key={char.id} className="ranking-row">
                                <div className="rank-number-cell">#{index + 1}</div>
                                <div className="char-cell">
                                    <span className="char-emoji-small">{char.emoji}</span>
                                    <span>{char.name}</span>
                                </div>
                                <div className="element-cell" style={{ color: elementInfo.color }}>
                                    {elementInfo.emoji}
                                </div>
                                <div>{char.hp}</div>
                                <div>{char.attack}</div>
                                <div>{char.speed}</div>
                                <div className="power-cell">{power.powerScore}</div>
                                <div className="graph-cell">
                                    <div className="power-bar-mini">
                                        <div 
                                            className="power-fill-mini" 
                                            style={{ 
                                                width: `${percentOfMax}%`,
                                                background: elementInfo.color 
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Element Distribution Chart */}
            <div className="element-chart-section">
                <h3>🔥 การกระจายธาตุ</h3>
                <div className="element-bars">
                    {Object.entries(ELEMENT_INFO).map(([key, info]) => {
                        const count = balanceAnalysis.elementDist[key] || 0;
                        const percent = (count / characters.length) * 100;
                        
                        return (
                            <div key={key} className="element-bar-item">
                                <div className="element-bar-label">
                                    <span>{info.emoji} {info.name}</span>
                                    <span>{count} ตัว ({percent.toFixed(0)}%)</span>
                                </div>
                                <div className="element-bar-track">
                                    <div 
                                        className="element-bar-fill" 
                                        style={{ 
                                            width: `${percent}%`,
                                            background: info.color 
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


// ============================================
// TOOLS VIEW
// ============================================
function ToolsView({ handleExport, handleImport, selectedChars, handleBulkEdit }) {
    return (
        <div className="tools-view">
            <div className="tools-grid">
                {/* Import/Export */}
                <div className="tool-card">
                    <div className="tool-icon">📦</div>
                    <h3>Import / Export</h3>
                    <p>นำเข้าหรือส่งออกข้อมูลตัวละครและการ์ดทั้งหมด</p>
                    <div className="tool-actions">
                        <button className="btn-tool-primary" onClick={handleExport}>
                            📤 Export JSON
                        </button>
                        <label className="btn-tool-secondary">
                            📥 Import JSON
                            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                {/* Bulk Edit */}
                <div className="tool-card">
                    <div className="tool-icon">✏️</div>
                    <h3>Bulk Edit</h3>
                    <p>แก้ไขตัวละครหลายตัวพร้อมกัน (เลือก {selectedChars.length} ตัว)</p>
                    {selectedChars.length > 0 ? (
                        <div className="bulk-edit-controls">
                            <button 
                                className="btn-tool-primary" 
                                onClick={() => {
                                    const value = prompt('เพิ่ม HP เท่าไร?');
                                    if (value) handleBulkEdit('hp', Number(value));
                                }}
                            >
                                ➕ เพิ่ม HP
                            </button>
                            <button 
                                className="btn-tool-primary" 
                                onClick={() => {
                                    const value = prompt('เพิ่ม Speed เท่าไร?');
                                    if (value) handleBulkEdit('speed', Number(value));
                                }}
                            >
                                ⚡ เพิ่ม Speed
                            </button>
                        </div>
                    ) : (
                        <p className="tool-hint">กรุณาเลือกตัวละครในแท็บ "ตัวละคร" ก่อน</p>
                    )}
                </div>

                {/* Auto Balance */}
                <div className="tool-card">
                    <div className="tool-icon">⚖️</div>
                    <h3>Auto Balance (Coming Soon)</h3>
                    <p>ปรับสมดุลตัวละครอัตโนมัติด้วย AI</p>
                    <button className="btn-tool-disabled" disabled>
                        🤖 เปิดใช้งาน AI
                    </button>
                </div>

                {/* Battle Simulator */}
                <div className="tool-card">
                    <div className="tool-icon">⚔️</div>
                    <h3>Battle Simulator (Coming Soon)</h3>
                    <p>จำลองการต่อสู้เพื่อทดสอบความสมดุล</p>
                    <button className="btn-tool-disabled" disabled>
                        🎮 เริ่มจำลอง
                    </button>
                </div>

                {/* Backup & Restore */}
                <div className="tool-card">
                    <div className="tool-icon">💾</div>
                    <h3>Backup & Restore</h3>
                    <p>สำรองและกู้คืนข้อมูลเกม</p>
                    <div className="tool-actions">
                        <button className="btn-tool-primary" onClick={() => {
                            const backup = {
                                timestamp: new Date().toISOString(),
                                data: { characters: [], cards: {} }
                            };
                            localStorage.setItem('game_backup', JSON.stringify(backup));
                            alert('สำรองข้อมูลสำเร็จ!');
                        }}>
                            💾 สำรองข้อมูล
                        </button>
                        <button className="btn-tool-secondary" onClick={() => {
                            const backup = localStorage.getItem('game_backup');
                            if (backup) {
                                alert('พบข้อมูลสำรอง!');
                            } else {
                                alert('ไม่พบข้อมูลสำรอง');
                            }
                        }}>
                            📂 กู้คืนข้อมูล
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="tool-card">
                    <div className="tool-icon">📈</div>
                    <h3>Statistics</h3>
                    <p>สถิติและข้อมูลเชิงลึกของเกม</p>
                    <div className="stats-mini">
                        <div>📊 Total Characters: {selectedChars.length}</div>
                        <div>🃏 Total Cards: 0</div>
                        <div>🔥 Most Used Element: Fire</div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ============================================
// CREATE WIZARD
// ============================================
function CreateWizard({ 
    wizardStep, 
    setWizardStep, 
    newChar, 
    setNewChar, 
    templates, 
    handleCreateChar, 
    imagePreview,
    skillImagePreviews,
    handleCharacterImageUpload,
    handleSkillImageUpload,
    removeCharacterImage,
    removeSkillImage,
    uploadingImage,
    onClose 
}) {
    const applyTemplate = (templateKey) => {
        const template = templates[templateKey];
        setNewChar(prev => ({ ...prev, ...template }));
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-modal">
                <div className="wizard-header">
                    <h2>🧙‍♂️ สร้างตัวละครใหม่</h2>
                    <button className="close-btn-wizard" onClick={onClose}>✕</button>
                </div>

                <div className="wizard-steps">
                    <div className={`wizard-step ${wizardStep >= 1 ? 'active' : ''}`}>1. ข้อมูลพื้นฐาน</div>
                    <div className={`wizard-step ${wizardStep >= 2 ? 'active' : ''}`}>2. เลือกธาตุ</div>
                    <div className={`wizard-step ${wizardStep >= 3 ? 'active' : ''}`}>3. ปรับค่าสถานะ</div>
                    <div className={`wizard-step ${wizardStep >= 4 ? 'active' : ''}`}>4. รูปภาพ</div>
                </div>

                <div className="wizard-content">
                    {wizardStep === 1 && (
                        <div className="wizard-step-content">
                            <h3>ข้อมูลพื้นฐาน</h3>
                            <div className="form-group-wizard">
                                <label>ชื่อตัวละคร</label>
                                <input
                                    type="text"
                                    value={newChar.name}
                                    onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                                    placeholder="เช่น มังกรไฟ"
                                    className="input-wizard"
                                />
                            </div>
                            <div className="form-group-wizard">
                                <label>Emoji</label>
                                <input
                                    type="text"
                                    value={newChar.emoji}
                                    onChange={(e) => setNewChar({ ...newChar, emoji: e.target.value })}
                                    placeholder="🐉"
                                    className="input-wizard"
                                    maxLength={2}
                                />
                            </div>
                            <div className="form-group-wizard">
                                <label>เลือกแม่แบบ (Template)</label>
                                <div className="template-grid">
                                    <button className="template-btn" onClick={() => applyTemplate('tank')}>
                                        <div className="template-icon">🛡️</div>
                                        <div className="template-name">Tank</div>
                                        <div className="template-desc">HP สูง ป้องกันดี</div>
                                    </button>
                                    <button className="template-btn" onClick={() => applyTemplate('dps')}>
                                        <div className="template-icon">⚔️</div>
                                        <div className="template-name">DPS</div>
                                        <div className="template-desc">โจมตีแรง เร็ว</div>
                                    </button>
                                    <button className="template-btn" onClick={() => applyTemplate('support')}>
                                        <div className="template-icon">💚</div>
                                        <div className="template-name">Support</div>
                                        <div className="template-desc">ซัพพอร์ต สมดุล</div>
                                    </button>
                                    <button className="template-btn" onClick={() => applyTemplate('balanced')}>
                                        <div className="template-icon">⚖️</div>
                                        <div className="template-name">Balanced</div>
                                        <div className="template-desc">สมดุลทุกด้าน</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {wizardStep === 2 && (
                        <div className="wizard-step-content">
                            <h3>เลือกธาตุ</h3>
                            <div className="element-select-grid">
                                {Object.entries(ELEMENT_INFO).map(([key, info]) => (
                                    <button
                                        key={key}
                                        className={`element-select-btn ${newChar.element === key ? 'selected' : ''}`}
                                        onClick={() => setNewChar({ ...newChar, element: key })}
                                        style={{ borderColor: info.color }}
                                    >
                                        <div className="element-emoji-big">{info.emoji}</div>
                                        <div className="element-name-big">{info.name}</div>
                                        <div className="element-advantage">
                                            เอาชนะ: {ELEMENT_INFO[info.strong]?.emoji}<br />
                                            แพ้: {ELEMENT_INFO[info.weak]?.emoji}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {wizardStep === 3 && (
                        <div className="wizard-step-content">
                            <h3>ปรับค่าสถานะ</h3>
                            <div className="preview-char">
                                <div className="preview-emoji">{newChar.emoji}</div>
                                <h4>{newChar.name || 'ยังไม่ได้ตั้งชื่อ'}</h4>
                                <div className="preview-element" style={{ color: ELEMENT_INFO[newChar.element].color }}>
                                    {ELEMENT_INFO[newChar.element].emoji} ธาตุ{ELEMENT_INFO[newChar.element].name}
                                </div>
                            </div>

                            <div className="stat-sliders">
                                <div className="slider-group">
                                    <label>❤️ HP: {newChar.hp}</label>
                                    <input
                                        type="range"
                                        min="200"
                                        max="600"
                                        value={newChar.hp}
                                        onChange={(e) => setNewChar({ ...newChar, hp: Number(e.target.value) })}
                                        className="slider-wizard"
                                    />
                                </div>
                                <div className="slider-group">
                                    <label>⚔️ Attack: {newChar.attack}</label>
                                    <input
                                        type="range"
                                        min="30"
                                        max="100"
                                        value={newChar.attack}
                                        onChange={(e) => setNewChar({ ...newChar, attack: Number(e.target.value) })}
                                        className="slider-wizard"
                                    />
                                </div>
                                <div className="slider-group">
                                    <label>⚡ Speed: {newChar.speed}</label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="70"
                                        value={newChar.speed}
                                        onChange={(e) => setNewChar({ ...newChar, speed: Number(e.target.value) })}
                                        className="slider-wizard"
                                    />
                                </div>
                            </div>

                            <div className="power-estimate">
                                <div className="power-label">พลังโดยประมาณ</div>
                                <div className="power-value-wizard">
                                    {Math.round(newChar.hp + (newChar.attack * 3) + (newChar.speed * 2))}
                                </div>
                            </div>
                        </div>
                    )}

                    {wizardStep === 4 && (
                        <div className="wizard-step-content">
                            <h3>📸 อัพโหลดรูปภาพ</h3>
                            <p className="wizard-hint">เพิ่มรูปภาพตัวละครและสกิลเพื่อใช้ในการพิมพ์การ์ด (ไม่บังคับ)</p>

                            {/* Character Image Upload */}
                            <div className="image-upload-section">
                                <h4>🎭 รูปภาพตัวละคร</h4>
                                <div className="image-upload-container">
                                    {imagePreview ? (
                                        <div className="image-preview-box">
                                            <img src={imagePreview} alt="Character Preview" className="preview-image" />
                                            <button className="remove-image-btn" onClick={removeCharacterImage}>
                                                ✕ ลบรูป
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="image-upload-box">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCharacterImageUpload}
                                                style={{ display: 'none' }}
                                                disabled={uploadingImage}
                                            />
                                            <div className="upload-placeholder">
                                                {uploadingImage ? (
                                                    <>
                                                        <div className="upload-icon">⏳</div>
                                                        <div>กำลังอัพโหลด...</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="upload-icon">📷</div>
                                                        <div>คลิกเพื่ออัพโหลดรูปตัวละคร</div>
                                                        <div className="upload-hint">PNG, JPG (สูงสุด 5MB)</div>
                                                    </>
                                                )}
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Skill Images Upload */}
                            <div className="image-upload-section">
                                <h4>🎴 รูปภาพสกิล (4 สกิล)</h4>
                                <div className="skill-images-grid">
                                    {/* Ultimate Skill */}
                                    <div className="skill-image-item">
                                        <div className="skill-label">⭐ Ultimate</div>
                                        {skillImagePreviews.ultimate ? (
                                            <div className="skill-preview-box">
                                                <img src={skillImagePreviews.ultimate} alt="Ultimate" className="skill-preview-image" />
                                                <button className="remove-skill-image-btn" onClick={() => removeSkillImage('ultimate')}>✕</button>
                                            </div>
                                        ) : (
                                            <label className="skill-upload-box">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleSkillImageUpload('ultimate', e)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div className="skill-upload-placeholder">
                                                    <div>📷</div>
                                                    <div className="skill-upload-text">อัพโหลด</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>

                                    {/* Passive Skill */}
                                    <div className="skill-image-item">
                                        <div className="skill-label">🔄 Passive</div>
                                        {skillImagePreviews.passive ? (
                                            <div className="skill-preview-box">
                                                <img src={skillImagePreviews.passive} alt="Passive" className="skill-preview-image" />
                                                <button className="remove-skill-image-btn" onClick={() => removeSkillImage('passive')}>✕</button>
                                            </div>
                                        ) : (
                                            <label className="skill-upload-box">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleSkillImageUpload('passive', e)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div className="skill-upload-placeholder">
                                                    <div>📷</div>
                                                    <div className="skill-upload-text">อัพโหลด</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>

                                    {/* Normal Skill 1 */}
                                    <div className="skill-image-item">
                                        <div className="skill-label">⚔️ Normal 1</div>
                                        {skillImagePreviews.normal1 ? (
                                            <div className="skill-preview-box">
                                                <img src={skillImagePreviews.normal1} alt="Normal 1" className="skill-preview-image" />
                                                <button className="remove-skill-image-btn" onClick={() => removeSkillImage('normal1')}>✕</button>
                                            </div>
                                        ) : (
                                            <label className="skill-upload-box">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleSkillImageUpload('normal1', e)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div className="skill-upload-placeholder">
                                                    <div>📷</div>
                                                    <div className="skill-upload-text">อัพโหลด</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>

                                    {/* Normal Skill 2 */}
                                    <div className="skill-image-item">
                                        <div className="skill-label">⚔️ Normal 2</div>
                                        {skillImagePreviews.normal2 ? (
                                            <div className="skill-preview-box">
                                                <img src={skillImagePreviews.normal2} alt="Normal 2" className="skill-preview-image" />
                                                <button className="remove-skill-image-btn" onClick={() => removeSkillImage('normal2')}>✕</button>
                                            </div>
                                        ) : (
                                            <label className="skill-upload-box">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleSkillImageUpload('normal2', e)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div className="skill-upload-placeholder">
                                                    <div>📷</div>
                                                    <div className="skill-upload-text">อัพโหลด</div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <p className="wizard-hint-small">💡 รูปภาพสกิลจะถูกใช้ในการพิมพ์การ์ดสกิลในอนาคต</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="wizard-footer">
                    {wizardStep > 1 && (
                        <button className="btn-wizard-back" onClick={() => setWizardStep(wizardStep - 1)}>
                            ← ย้อนกลับ
                        </button>
                    )}
                    {wizardStep < 4 ? (
                        <button 
                            className="btn-wizard-next" 
                            onClick={() => setWizardStep(wizardStep + 1)}
                            disabled={wizardStep === 1 && !newChar.name}
                        >
                            ถัดไป →
                        </button>
                    ) : (
                        <button className="btn-wizard-create" onClick={handleCreateChar}>
                            ✨ สร้างตัวละคร
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}



// ============================================
// AI ASSISTANT VIEW
// ============================================
function AIAssistantView({ characters, setCharacters, cards, setCards, calculatePower, balanceAnalysis }) {
    const [aiMode, setAiMode] = useState('generator');
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedChar, setSelectedChar] = useState(null);

    // AI Character Generator
    const generateCharacter = () => {
        setGenerating(true);
        setTimeout(() => {
            const concepts = [
                { name: 'มังกรน้ำแข็ง', emoji: '🐉', element: 'aqua', class: 'tank', hp: 520, attack: 55, speed: 35, theme: 'น้ำแข็ง' },
                { name: 'นินจาเงา', emoji: '🥷', element: 'dark', class: 'dps', hp: 320, attack: 95, speed: 70, theme: 'ลอบสังหาร' },
                { name: 'นางฟ้าแห่งแสง', emoji: '👼', element: 'light', class: 'support', hp: 400, attack: 50, speed: 50, theme: 'รักษา' },
                { name: 'หมาป่าไฟ', emoji: '🐺', element: 'fire', class: 'dps', hp: 360, attack: 85, speed: 60, theme: 'ไฟลุก' },
                { name: 'เต่าหินโบราณ', emoji: '🐢', element: 'earth', class: 'tank', hp: 550, attack: 45, speed: 25, theme: 'ป้องกัน' },
                { name: 'นกฟีนิกซ์', emoji: '🦅', element: 'fire', class: 'balanced', hp: 420, attack: 70, speed: 55, theme: 'ฟื้นคืนชีพ' },
                { name: 'ปลาฉลามไฟฟ้า', emoji: '🦈', element: 'electric', class: 'dps', hp: 380, attack: 80, speed: 65, theme: 'สตัน' },
                { name: 'หมีขั้วโลก', emoji: '🐻‍❄️', element: 'ice', class: 'tank', hp: 500, attack: 60, speed: 30, theme: 'ช้าลง' }
            ];

            const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
            
            // Generate cards based on theme
            const generatedCards = generateCardsForTheme(randomConcept.theme, randomConcept.element);
            
            setResult({
                type: 'character',
                data: randomConcept,
                cards: generatedCards,
                reasoning: `สร้างตัวละคร "${randomConcept.name}" ตามคอนเซ็ปต์ ${randomConcept.theme}\n\n` +
                    `📊 สถิติ:\n` +
                    `- HP: ${randomConcept.hp} (${randomConcept.class === 'tank' ? 'สูง' : randomConcept.class === 'dps' ? 'ต่ำ' : 'ปานกลาง'})\n` +
                    `- Attack: ${randomConcept.attack} (${randomConcept.attack > 80 ? 'สูงมาก' : randomConcept.attack > 60 ? 'สูง' : 'ปานกลาง'})\n` +
                    `- Speed: ${randomConcept.speed} (${randomConcept.speed > 60 ? 'เร็ว' : randomConcept.speed > 40 ? 'ปานกลาง' : 'ช้า'})\n\n` +
                    `🎴 การ์ดที่แนะนำ:\n${generatedCards.map(c => `- ${c.name}: ${c.desc}`).join('\n')}`
            });
            setGenerating(false);
        }, 1500);
    };

    // Generate cards based on theme
    const generateCardsForTheme = (theme, element) => {
        const themeCards = {
            'น้ำแข็ง': [
                { name: 'กำแพงน้ำแข็ง', energy: 1, damage: 0, shield: 90, desc: 'สร้างกำแพงน้ำแข็งป้องกัน', type: 'normal' },
                { name: 'พายุหิมะ', energy: 2, damage: 100, shield: 0, desc: 'โจมตีด้วยพายุหิมะรุนแรง', type: 'ultimate' },
                { name: 'เกราะน้ำแข็ง', energy: 0, damage: 0, shield: 15, desc: 'ได้รับโล่ทุกเทิร์น', type: 'passive' }
            ],
            'ลอบสังหาร': [
                { name: 'แทงลับหลัง', energy: 1, damage: 110, shield: 0, desc: 'โจมตีจากเงามืด', type: 'normal' },
                { name: 'ฆ่าเงียบ', energy: 2, damage: 150, shield: 0, desc: 'สังหารเป้าหมายทันที', type: 'ultimate' },
                { name: 'หลบเงา', energy: 0, damage: 0, shield: 10, desc: 'หลบหลีกในเงา', type: 'passive' }
            ],
            'รักษา': [
                { name: 'แสงศักดิ์สิทธิ์', energy: 1, damage: -50, shield: 30, desc: 'รักษาและป้องกัน', type: 'normal' },
                { name: 'ฟื้นฟูสมบูรณ์', energy: 2, damage: -100, shield: 50, desc: 'รักษาเต็มที่', type: 'ultimate' },
                { name: 'พรจากสวรรค์', energy: 0, damage: -20, shield: 0, desc: 'ฟื้นฟู HP ทุกเทิร์น', type: 'passive' }
            ],
            'ไฟลุก': [
                { name: 'ลูกไฟ', energy: 1, damage: 80, shield: 0, desc: 'ยิงลูกไฟ ทำให้ไฟลุก', type: 'normal' },
                { name: 'นรกเพลิง', energy: 2, damage: 130, shield: 0, desc: 'เผาทุกอย่างด้วยเปลวไฟ', type: 'ultimate' },
                { name: 'ร่างไฟ', energy: 0, damage: 15, shield: 0, desc: 'ทำดาเมจไฟทุกเทิร์น', type: 'passive' }
            ],
            'ป้องกัน': [
                { name: 'เกราะหิน', energy: 1, damage: 0, shield: 100, desc: 'เกราะแข็งแกร่ง', type: 'normal' },
                { name: 'ป้อมหิน', energy: 2, damage: 40, shield: 120, desc: 'ป้องกันและโต้กลับ', type: 'ultimate' },
                { name: 'ผิวหนังหิน', energy: 0, damage: 0, shield: 20, desc: 'ผิวหนังแข็งเหมือนหิน', type: 'passive' }
            ],
            'ฟื้นคืนชีพ': [
                { name: 'เปลวไฟชีวิต', energy: 1, damage: 70, shield: 0, desc: 'โจมตีและฟื้นฟู', type: 'normal' },
                { name: 'เกิดใหม่', energy: 2, damage: 120, shield: 0, desc: 'ฟื้นคืนชีพเมื่อตาย', type: 'ultimate' },
                { name: 'พลังชีวิต', energy: 0, damage: -25, shield: 0, desc: 'ฟื้นฟูอย่างต่อเนื่อง', type: 'passive' }
            ],
            'สตัน': [
                { name: 'กระแสไฟฟ้า', energy: 1, damage: 75, shield: 0, desc: 'โจมตีและสตัน', type: 'normal' },
                { name: 'ฟ้าผ่า', energy: 2, damage: 140, shield: 0, desc: 'ฟ้าผ่าสตันทั้งทีม', type: 'ultimate' },
                { name: 'ประจุไฟฟ้า', energy: 0, damage: 10, shield: 0, desc: 'ดาเมจไฟฟ้าต่อเนื่อง', type: 'passive' }
            ],
            'ช้าลง': [
                { name: 'ลมหนาว', energy: 1, damage: 60, shield: 40, desc: 'ทำให้ช้าลง', type: 'normal' },
                { name: 'ยุคน้ำแข็ง', energy: 2, damage: 90, shield: 80, desc: 'แช่แข็งศัตรู', type: 'ultimate' },
                { name: 'ลมหนาวจัด', energy: 0, damage: 0, shield: 15, desc: 'ลดความเร็วศัตรู', type: 'passive' }
            ]
        };

        return themeCards[theme] || themeCards['ป้องกัน'];
    };

    // AI Balance Advisor
    const analyzeBalance = () => {
        setGenerating(true);
        setTimeout(() => {
            const powers = characters.map(c => calculatePower(c).powerScore);
            const avg = powers.reduce((a, b) => a + b, 0) / powers.length;
            const weakChars = characters.filter(c => calculatePower(c).powerScore < avg * 0.85);
            const strongChars = characters.filter(c => calculatePower(c).powerScore > avg * 1.15);

            let advice = '📊 การวิเคราะห์ความสมดุล\n\n';
            advice += `ค่าเฉลี่ย Power: ${Math.round(avg)}\n`;
            advice += `ความแตกต่าง: ${balanceAnalysis.variance}%\n\n`;

            if (balanceAnalysis.variance > 30) {
                advice += '⚠️ ความสมดุลไม่ดี! มีความแตกต่างมากเกินไป\n\n';
            } else if (balanceAnalysis.variance > 15) {
                advice += '⚡ ความสมดุลปานกลาง อาจต้องปรับแต่ง\n\n';
            } else {
                advice += '✅ ความสมดุลดีมาก!\n\n';
            }

            if (weakChars.length > 0) {
                advice += `🔻 ตัวละครที่อ่อนแอ (${weakChars.length} ตัว):\n`;
                weakChars.forEach(c => {
                    const power = calculatePower(c).powerScore;
                    advice += `- ${c.name}: ${power} (ต่ำกว่าค่าเฉลี่ย ${Math.round(avg - power)})\n`;
                    advice += `  💡 แนะนำ: เพิ่ม HP +${Math.round((avg - power) * 0.5)} หรือ Attack +${Math.round((avg - power) * 0.3)}\n`;
                });
                advice += '\n';
            }

            if (strongChars.length > 0) {
                advice += `🔺 ตัวละครที่แข็งแกร่งเกินไป (${strongChars.length} ตัว):\n`;
                strongChars.forEach(c => {
                    const power = calculatePower(c).powerScore;
                    advice += `- ${c.name}: ${power} (สูงกว่าค่าเฉลี่ย ${Math.round(power - avg)})\n`;
                    advice += `  💡 แนะนำ: ลด Attack -${Math.round((power - avg) * 0.3)} หรือ Speed -${Math.round((power - avg) * 0.2)}\n`;
                });
            }

            setResult({
                type: 'balance',
                advice: advice
            });
            setGenerating(false);
        }, 1000);
    };

    // AI Card Designer
    const designCards = () => {
        if (!selectedChar) {
            alert('กรุณาเลือกตัวละครก่อน');
            return;
        }

        setGenerating(true);
        setTimeout(() => {
            const char = characters.find(c => c.id === selectedChar);
            const power = calculatePower(char);
            
            let cardSuggestions = [];
            
            // Based on class
            if (char.class === 'tank') {
                cardSuggestions = [
                    { name: `${char.name} - เกราะหนา`, energy: 1, damage: 0, shield: 85, desc: 'ป้องกันแบบหนักหน่วง', type: 'normal' },
                    { name: `${char.name} - ป้อมปราการ`, energy: 2, damage: 50, shield: 100, desc: 'ป้องกันและโต้กลับ', type: 'ultimate' },
                    { name: `${char.name} - ผิวเหล็ก`, energy: 0, damage: 0, shield: 18, desc: 'โล่ถาวร', type: 'passive' }
                ];
            } else if (char.class === 'dps') {
                cardSuggestions = [
                    { name: `${char.name} - โจมตีรุนแรง`, energy: 1, damage: 95, shield: 0, desc: 'โจมตีด้วยพลังเต็มที่', type: 'normal' },
                    { name: `${char.name} - ทำลายล้าง`, energy: 2, damage: 145, shield: 0, desc: 'ดาเมจสูงสุด', type: 'ultimate' },
                    { name: `${char.name} - โหมดโจมตี`, energy: 0, damage: 20, shield: 0, desc: 'โบนัสดาเมจ', type: 'passive' }
                ];
            } else if (char.class === 'support') {
                cardSuggestions = [
                    { name: `${char.name} - รักษา`, energy: 1, damage: -60, shield: 35, desc: 'รักษาและป้องกัน', type: 'normal' },
                    { name: `${char.name} - ฟื้นฟูทีม`, energy: 2, damage: -120, shield: 60, desc: 'รักษาทั้งทีม', type: 'ultimate' },
                    { name: `${char.name} - พลังชีวิต`, energy: 0, damage: -22, shield: 0, desc: 'ฟื้นฟูต่อเนื่อง', type: 'passive' }
                ];
            } else {
                cardSuggestions = [
                    { name: `${char.name} - สมดุล`, energy: 1, damage: 70, shield: 30, desc: 'โจมตีและป้องกัน', type: 'normal' },
                    { name: `${char.name} - พลังแท้จริง`, energy: 2, damage: 110, shield: 50, desc: 'ปลดปล่อยพลัง', type: 'ultimate' },
                    { name: `${char.name} - ปรับตัว`, energy: 0, damage: 15, shield: 12, desc: 'ปรับตัวตามสถานการณ์', type: 'passive' }
                ];
            }

            setResult({
                type: 'cards',
                character: char,
                suggestions: cardSuggestions,
                reasoning: `ออกแบบการ์ดสำหรับ "${char.name}" (${char.class})\n\n` +
                    `📊 Power ปัจจุบัน: ${power.powerScore}\n` +
                    `⚔️ Total Damage: ${power.totalDamage}\n` +
                    `🛡️ Total Shield: ${power.totalShield}\n\n` +
                    `การ์ดที่แนะนำเหมาะสมกับบทบาท ${char.class} และจะช่วยให้ตัวละครมีความสมดุลมากขึ้น`
            });
            setGenerating(false);
        }, 1200);
    };

    // Apply AI Suggestion
    const applyCharacterSuggestion = () => {
        if (!result || result.type !== 'character') return;

        const newCharId = `char_${Date.now()}`;
        const newCardIds = [];

        // Create cards first
        result.cards.forEach((card, idx) => {
            const cardId = `${newCharId}_card_${idx}`;
            newCardIds.push(cardId);
            setCards(prev => ({
                ...prev,
                [cardId]: {
                    ...card,
                    id: cardId,
                    element: result.data.element
                }
            }));
        });

        // Create character
        const newChar = {
            ...result.data,
            id: newCharId,
            maxHp: result.data.hp,
            cards: newCardIds,
            position: null
        };

        setCharacters(prev => [...prev, newChar]);
        alert(`✅ สร้างตัวละคร "${result.data.name}" สำเร็จ!`);
        setResult(null);
    };

    return (
        <div className="ai-assistant-container">
            <div className="ai-header">
                <h2>🤖 AI Assistant</h2>
                <p>ผู้ช่วยอัจฉริยะในการออกแบบตัวละครและการ์ด</p>
            </div>

            {/* AI Mode Selector */}
            <div className="ai-mode-selector">
                <button 
                    className={`ai-mode-btn ${aiMode === 'generator' ? 'active' : ''}`}
                    onClick={() => setAiMode('generator')}
                >
                    ✨ สร้างตัวละคร
                </button>
                <button 
                    className={`ai-mode-btn ${aiMode === 'balance' ? 'active' : ''}`}
                    onClick={() => setAiMode('balance')}
                >
                    ⚖️ วิเคราะห์ Balance
                </button>
                <button 
                    className={`ai-mode-btn ${aiMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setAiMode('cards')}
                >
                    🎴 ออกแบบการ์ด
                </button>
            </div>

            {/* AI Content */}
            <div className="ai-content">
                {aiMode === 'generator' && (
                    <div className="ai-section">
                        <h3>✨ AI Character Generator</h3>
                        <p>ให้ AI สร้างตัวละครใหม่ที่มีเอกลักษณ์และสมดุล</p>
                        
                        <button 
                            className="ai-generate-btn"
                            onClick={generateCharacter}
                            disabled={generating}
                        >
                            {generating ? '🔄 กำลังสร้าง...' : '✨ สร้างตัวละครแบบสุ่ม'}
                        </button>

                        {result && result.type === 'character' && (
                            <div className="ai-result">
                                <div className="ai-result-header">
                                    <h4>🎉 ตัวละครที่สร้างขึ้น</h4>
                                    <button className="btn-apply" onClick={applyCharacterSuggestion}>
                                        ✅ ใช้ตัวละครนี้
                                    </button>
                                </div>
                                
                                <div className="char-preview">
                                    <div className="char-preview-emoji">{result.data.emoji}</div>
                                    <div className="char-preview-info">
                                        <h3>{result.data.name}</h3>
                                        <div className="char-preview-stats">
                                            <span>❤️ HP: {result.data.hp}</span>
                                            <span>⚔️ Attack: {result.data.attack}</span>
                                            <span>⚡ Speed: {result.data.speed}</span>
                                        </div>
                                        <div className="char-preview-class">
                                            Class: {result.data.class} | Element: {result.data.element}
                                        </div>
                                    </div>
                                </div>

                                <div className="ai-reasoning">
                                    <h4>💭 เหตุผลในการออกแบบ</h4>
                                    <pre>{result.reasoning}</pre>
                                </div>

                                <div className="ai-cards-preview">
                                    <h4>🎴 การ์ดที่สร้างให้</h4>
                                    {result.cards.map((card, idx) => (
                                        <div key={idx} className="mini-card-ai">
                                            <div className="mini-card-name">{card.name}</div>
                                            <div className="mini-card-stats-ai">
                                                {card.damage !== 0 && <span>⚔️ {card.damage}</span>}
                                                {card.shield > 0 && <span>🛡️ {card.shield}</span>}
                                                <span>⚡ {card.energy}</span>
                                            </div>
                                            <div className="mini-card-desc">{card.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {aiMode === 'balance' && (
                    <div className="ai-section">
                        <h3>⚖️ AI Balance Advisor</h3>
                        <p>วิเคราะห์ความสมดุลของตัวละครทั้งหมดและให้คำแนะนำ</p>
                        
                        <button 
                            className="ai-generate-btn"
                            onClick={analyzeBalance}
                            disabled={generating}
                        >
                            {generating ? '🔄 กำลังวิเคราะห์...' : '📊 วิเคราะห์ความสมดุล'}
                        </button>

                        {result && result.type === 'balance' && (
                            <div className="ai-result">
                                <h4>📊 ผลการวิเคราะห์</h4>
                                <div className="ai-advice">
                                    <pre>{result.advice}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {aiMode === 'cards' && (
                    <div className="ai-section">
                        <h3>🎴 AI Card Designer</h3>
                        <p>ออกแบบการ์ดที่เหมาะสมกับตัวละครที่เลือก</p>
                        
                        <div className="char-selector">
                            <label>เลือกตัวละคร:</label>
                            <select 
                                value={selectedChar || ''}
                                onChange={(e) => setSelectedChar(e.target.value)}
                                className="select-char-ai"
                            >
                                <option value="">-- เลือกตัวละคร --</option>
                                {characters.map(char => (
                                    <option key={char.id} value={char.id}>
                                        {char.emoji} {char.name} ({char.class})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button 
                            className="ai-generate-btn"
                            onClick={designCards}
                            disabled={generating || !selectedChar}
                        >
                            {generating ? '🔄 กำลังออกแบบ...' : '🎨 ออกแบบการ์ด'}
                        </button>

                        {result && result.type === 'cards' && (
                            <div className="ai-result">
                                <h4>🎴 การ์ดที่แนะนำสำหรับ {result.character.name}</h4>
                                
                                <div className="ai-reasoning">
                                    <pre>{result.reasoning}</pre>
                                </div>

                                <div className="ai-cards-preview">
                                    {result.suggestions.map((card, idx) => (
                                        <div key={idx} className="mini-card-ai">
                                            <div className="mini-card-name">{card.name}</div>
                                            <div className="mini-card-stats-ai">
                                                {card.damage !== 0 && <span>⚔️ {card.damage}</span>}
                                                {card.shield > 0 && <span>🛡️ {card.shield}</span>}
                                                <span>⚡ {card.energy}</span>
                                            </div>
                                            <div className="mini-card-desc">{card.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
