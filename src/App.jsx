import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminPanelPro from './AdminPanelPro';
import './index.css';
import './AdminPanelPro.css';
import { CHARACTER_POOL, INITIAL_ENEMIES, CARDS_DB, ELEMENT_INFO, getElementMultiplier } from './gameData';
import { getAllCharacters, getAllCards } from './database';

const STICKERS = ['🔥', '👍', '🤣', '💀', '🥊', '🛡️', '⚡', '✨'];

function App() {
  const [characterPool, setCharacterPool] = useState(CHARACTER_POOL);
  const [cardsDb, setCardsDb] = useState(CARDS_DB);
  const [showAdminPro, setShowAdminPro] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [gameState, setGameState] = useState('setup'); // 'setup', 'battle'
  const [playerTeam, setPlayerTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState(INITIAL_ENEMIES);
  const [energy, setEnergy] = useState(3);
  const [round, setRound] = useState(1);
  const [selectedCards, setSelectedCards] = useState([]);
  const [logs, setLogs] = useState(['การต่อสู้เริ่มขึ้น!']);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeChar, setActiveChar] = useState(null);
  const [animationClass, setAnimationClass] = useState('');
  const [characterEffects, setCharacterEffects] = useState({});
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    { user: 'System', text: 'ยินดีต้อนรับสู่ Arena! 🎮' },
  ]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [extraTimeCharges, setExtraTimeCharges] = useState(2);
  const [pauseCharges, setPauseCharges] = useState(1);
  const [hasUsedExtraTimeThisTurn, setHasUsedExtraTimeThisTurn] = useState(false);
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);

  const [selectedCharToPlace, setSelectedCharToPlace] = useState(null);
  
  // Combat enhancements
  const [targetedEnemy, setTargetedEnemy] = useState(null);
  const [combatLogs, setCombatLogs] = useState([]);
  const [characterStatuses, setCharacterStatuses] = useState({}); // buffs/debuffs
  const [energyAnimation, setEnergyAnimation] = useState(false);
  
  // Discard system
  const [discardMode, setDiscardMode] = useState(false);
  const [cardsToDiscard, setCardsToDiscard] = useState([]);

  // Refs to always have the latest team data inside async functions
  const playerTeamRef = useRef(playerTeam);
  const enemyTeamRef = useRef(enemyTeam);

  useEffect(() => { playerTeamRef.current = playerTeam; }, [playerTeam]);
  useEffect(() => { enemyTeamRef.current = enemyTeam; }, [enemyTeam]);

  // --- Load Data from Supabase on Mount ---
  useEffect(() => {
    async function loadData() {
      try {
        console.log('🔄 กำลังโหลดข้อมูลจาก Supabase...');
        
        // โหลดตัวละครและการ์ดจาก Supabase
        const [characters, cards] = await Promise.all([
          getAllCharacters(),
          getAllCards()
        ]);

        console.log('✅ โหลดข้อมูลสำเร็จ:', {
          characters: characters.length,
          cards: Object.keys(cards).length
        });

        // ถ้ามีข้อมูลใน Supabase ให้ใช้ข้อมูลนั้น
        if (characters.length > 0) {
          // แปลง characters จาก Supabase format เป็น app format
          const formattedChars = characters.map(char => ({
            id: char.id,
            name: char.name,
            element: char.element,
            hp: char.hp,
            maxHp: char.max_hp,
            shield: 0,
            emoji: char.emoji,
            attack: char.attack,
            speed: char.speed,
            baseSpeed: char.speed,
            cards: char.cards || [],
            ability: char.ability,
            class: char.class,
            image: char.image,
            position: null
          }));
          
          setCharacterPool(formattedChars);
          console.log('✅ อัปเดต characterPool จาก Supabase');
        } else {
          console.log('ℹ️ ไม่มีข้อมูลใน Supabase, ใช้ข้อมูลเริ่มต้น');
        }

        if (Object.keys(cards).length > 0) {
          setCardsDb(cards);
          console.log('✅ อัปเดต cardsDb จาก Supabase');
        } else {
          console.log('ℹ️ ไม่มีการ์ดใน Supabase, ใช้การ์ดเริ่มต้น');
        }

      } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        console.log('ℹ️ ใช้ข้อมูลเริ่มต้นแทน');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, []);

  // --- Game Over Detection ---
  useEffect(() => {
    if (gameState !== 'battle') return;

    const livingPlayers = playerTeam.filter(p => p.hp > 0).length;
    const livingEnemies = enemyTeam.filter(e => e.hp > 0).length;

    if (livingEnemies === 0 && enemyTeam.length > 0) {
      setGameState('victory');
      addLog("🎉 ยินดีด้วย! คุณชนะการต่อสู้");
    } else if (livingPlayers === 0 && playerTeam.length > 0) {
      setGameState('defeat');
      addLog("💀 คุณพ่ายแพ้... พยายามใหม่อีกครั้งนะ");
    }
  }, [playerTeam, enemyTeam, gameState]);

  // Setup Phase Logic
  const toggleSelectCharacter = (char) => {
    // If char is already selected to be placed, deselect it
    if (selectedCharToPlace?.id === char.id) {
      setSelectedCharToPlace(null);
      return;
    }

    // Select char to place
    setSelectedCharToPlace(char);
  };

  const handleSlotClick = (index) => {
    if (selectedCharToPlace) {
      const charInTeam = playerTeam.find(c => c.id === selectedCharToPlace.id);

      if (charInTeam) {
        // Move existing char
        setPlayerTeam(prev => prev.map(c =>
          c.id === selectedCharToPlace.id ? { ...c, position: index } : (c.position === index ? null : c)
        ).filter(Boolean));
      } else {
        // Add new char (replace if slot occupied)
        if (playerTeam.length < 3 || playerTeam.some(c => c.position === index)) {
          const filteredTeam = playerTeam.filter(c => c.position !== index);
          setPlayerTeam([...filteredTeam, { ...selectedCharToPlace, position: index }]);
        } else {
          addLog("ทีมเต็มแล้ว! (สูงสุด 3 ตัว)");
        }
      }
      setSelectedCharToPlace(null);
    } else {
      // Pick up char from grid
      const charInSlot = playerTeam.find(c => c.position === index);
      if (charInSlot) {
        setSelectedCharToPlace(charInSlot);
      }
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, char) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('charId', char.id);
    setSelectedCharToPlace(char);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const charId = e.dataTransfer.getData('charId');
    const char = characterPool.find(c => c.id === charId) || playerTeam.find(c => c.id === charId);

    if (char) {
      const charInTeam = playerTeam.find(c => c.id === char.id);

      if (charInTeam) {
        // Move existing char
        setPlayerTeam(prev => prev.map(c =>
          c.id === char.id ? { ...c, position: index } : (c.position === index ? null : c)
        ).filter(Boolean));
      } else {
        // Add new char (replace if slot occupied)
        if (playerTeam.length < 3 || playerTeam.some(c => c.position === index)) {
          const filteredTeam = playerTeam.filter(c => c.position !== index);
          setPlayerTeam([...filteredTeam, { ...char, position: index }]);
        } else {
          addLog("ทีมเต็มแล้ว! (สูงสุด 3 ตัว)");
        }
      }
    }
    setSelectedCharToPlace(null);
  };


  const removeCharacter = (charId) => {
    setPlayerTeam(prev => prev.filter(c => c.id !== charId));
  };

  const startBattle = () => {
    if (playerTeam.length === 3) {
      // Prepare Deck (Include non-passive cards, 2 copies each like Axie Infinity)
      let initialDeck = [];
      playerTeam.forEach(char => {
        char.cards.forEach(cardId => {
          const card = cardsDb[cardId];
          if (card && card.type !== 'passive') {
            // Add unique instances of cards to deck
            initialDeck.push({ ...card, charId: char.id, instanceId: Math.random().toString(36).substr(2, 9) });
            initialDeck.push({ ...card, charId: char.id, instanceId: Math.random().toString(36).substr(2, 9) });
          }
        });
      });

      // Shuffle
      initialDeck = [...initialDeck].sort(() => Math.random() - 0.5);

      // Draw initial hand (6 cards)
      const initialHand = initialDeck.slice(0, 6);
      const remainingDeck = initialDeck.slice(6);

      setDeck(remainingDeck);
      setHand(initialHand);
      setGameState('battle');
      addLog("เริ่มการต่อสู้! เตรียมตัวให้พร้อม");
    }
  };

  const drawCards = useCallback((count) => {
    setHand(prevHand => {
      let currentDeck = [...deck];

      // If deck is low, reshuffle
      if (currentDeck.length < count) {
        let recycledDeck = [];
        playerTeam.filter(p => p.hp > 0).forEach(char => {
          char.cards.forEach(cardId => {
            const card = cardsDb[cardId];
            if (card && card.type !== 'passive') {
              recycledDeck.push({ ...card, charId: char.id, instanceId: Math.random().toString(36).substr(2, 9) });
              recycledDeck.push({ ...card, charId: char.id, instanceId: Math.random().toString(36).substr(2, 9) });
            }
          });
        });
        currentDeck = [...currentDeck, ...recycledDeck].sort(() => Math.random() - 0.5);
      }

      const drawn = currentDeck.slice(0, count);
      setDeck(currentDeck.slice(count));
      return [...prevHand, ...drawn].slice(0, 9); // Max hand size 9
    });
  }, [deck, playerTeam, cardsDb]);


  const resetGame = () => {
    setGameState('setup');
    setPlayerTeam([]);
    setEnemyTeam(INITIAL_ENEMIES);
    setEnergy(3);
    setRound(1);
    setSelectedCards([]);
    setDeck([]);
    setHand([]);
    setPauseCharges(1);
    setLogs(['เริ่มเกมใหม่! จัดทีมของคุณ']);
    setIsExecuting(false);
    setIsPaused(false);
    setTimeLeft(60);
  };

  // Pause/Resume functionality
  const togglePause = () => {
    if (!isPaused && pauseCharges <= 0) {
      addLog("⚠️ คุณใช้โควตาการหยุดครบแล้ว!");
      return;
    }

    if (!isPaused) {
      setPauseCharges(prev => prev - 1);
    }

    setIsPaused(prev => !prev);
    addLog(isPaused ? "เกมกลับมาทำงานแล้ว" : "เกมหยุดชั่วคราว (เหลือโควตา: 0)");
  };

  // Chat auto-scroll logic
  const chatContainerRef = React.useRef(null);
  const combatLogRef = React.useRef(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLogs]);

  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 50));
  
  const addCombatLog = (msg, type = 'info') => {
    const logEntry = { msg, type, timestamp: Date.now() };
    setCombatLogs(prev => [logEntry, ...prev].slice(0, 30));
  };
  
  const showDamageNumber = (charId, value, type = 'damage') => {
    setCharacterEffects(prev => ({
      ...prev,
      [charId]: { type, value: type === 'damage' || type === 'crit' ? `-${value}` : `+${value}` }
    }));
    setTimeout(() => {
      setCharacterEffects(prev => {
        const newEffects = { ...prev };
        delete newEffects[charId];
        return newEffects;
      });
    }, 1200);
  };

  const sendSticker = (emoji) => setChatLog(prev => [...prev, { user: 'Player', text: emoji }]);

  const requestExtraTime = () => {
    if (extraTimeCharges > 0 && !hasUsedExtraTimeThisTurn && !isExecuting && !isPaused) {
      setTimeLeft(prev => prev + 15);
      setExtraTimeCharges(prev => prev - 1);
      setHasUsedExtraTimeThisTurn(true);
      addLog("คุณใช้ 'ขอเวลาเพิ่ม' (+15 วินาที)");
    }
  };


  // Apply passive skills at the start of each turn
  const applyPassiveSkills = useCallback(() => {
    // Apply passive skills for player team
    setPlayerTeam(prev => prev.map(char => {
      if (char.hp <= 0) return char;

      const passiveCard = char.cards
        .map(cardId => cardsDb[cardId])
        .find(card => card && card.type === 'passive');

      if (!passiveCard) return char;

      let newChar = { ...char };

      // Apply passive effects
      if (passiveCard.shield > 0) {
        const shieldGained = passiveCard.shield;
        newChar.shield = (newChar.shield || 0) + shieldGained;
        setCharacterStatuses(prev => ({
          ...prev,
          [char.id]: {
            ...prev[char.id],
            shield: (prev[char.id]?.shield || 0) + shieldGained
          }
        }));
        addLog(`${char.name} ได้รับโล่ ${shieldGained} จาก ${passiveCard.name}`);
        addCombatLog(`🛡️ ${char.name} ได้รับโล่ +${shieldGained} (${passiveCard.name})`, 'heal');
      }

      if (passiveCard.damage < 0) { // Healing
        const healAmount = Math.abs(passiveCard.damage);
        const oldHp = newChar.hp;
        newChar.hp = Math.min(newChar.maxHp, newChar.hp + healAmount);
        if (newChar.hp > oldHp) {
          const actualHeal = newChar.hp - oldHp;
          addLog(`${char.name} ฟื้นฟู HP ${actualHeal} จาก ${passiveCard.name}`);
          addCombatLog(`💚 ${char.name} ฟื้นฟู +${actualHeal} HP (${passiveCard.name})`, 'heal');
          showDamageNumber(char.id, actualHeal, 'heal');
        }
      }

      if (passiveCard.speedBonus) {
        newChar.speed = (newChar.baseSpeed || newChar.speed) + passiveCard.speedBonus;
      }

      return newChar;
    }));
  }, [cardsDb]);

  const executeTurn = useCallback(async (overrideCards = null) => {
    if (isExecuting || isPaused) return;
    setIsExecuting(true);
    const cardsToUse = overrideCards || selectedCards;

    addLog(`--- เริ่มรอบที่ ${round} ---`);
    addCombatLog(`⚔️ เริ่มรอบที่ ${round}`, 'system');

    // Apply passive skills first
    applyPassiveSkills();
    await new Promise(r => setTimeout(r, 500));

    // Process status effects at start of turn (Burn DoT, reduce durations)
    const processStatusEffects = (team, isPlayer) => {
      return team.map(char => {
        if (char.hp <= 0) return char;
        
        const status = characterStatuses[char.id];
        if (!status) return char;

        let newChar = { ...char };
        let newStatus = { ...status };

        // Process Burn (Damage over Time)
        if (newStatus.burn && newStatus.burn > 0) {
          const burnDamage = 20; // Fixed burn damage per turn
          newChar.hp = Math.max(0, newChar.hp - burnDamage);
          showDamageNumber(char.id, burnDamage, 'damage');
          addCombatLog(`🔥 ${char.name} ได้รับดาเมจจากไฟลุก -${burnDamage} HP`, 'damage');
          newStatus.burn -= 1;
          if (newStatus.burn <= 0) {
            delete newStatus.burn;
            addCombatLog(`${char.name} หายจากสถานะไฟลุก`, 'info');
          }
        }

        // Reduce Stun duration
        if (newStatus.stun && newStatus.stun > 0) {
          newStatus.stun -= 1;
          if (newStatus.stun <= 0) {
            delete newStatus.stun;
            addCombatLog(`${char.name} หายจากสถานะสตัน`, 'info');
          }
        }

        // Update status
        setCharacterStatuses(prev => ({
          ...prev,
          [char.id]: Object.keys(newStatus).length > 0 ? newStatus : undefined
        }));

        return newChar;
      });
    };

    // Process status effects for both teams
    setPlayerTeam(prev => processStatusEffects(prev, true));
    setEnemyTeam(prev => processStatusEffects(prev, false));
    await new Promise(r => setTimeout(r, 400));

    // Create turn order based on speed (like Axie Infinity)
    const allCharacters = [
      ...playerTeam.filter(p => p.hp > 0).map(p => ({ ...p, team: 'player' })),
      ...enemyTeam.filter(e => e.hp > 0).map(e => ({ ...e, team: 'enemy' }))
    ];

    // Sort by speed (highest first)
    const turnOrder = allCharacters.sort((a, b) => {
      if (b.speed === a.speed) return Math.random() - 0.5;
      return b.speed - a.speed;
    });

    addLog(`ลำดับการโจมตี: ${turnOrder.map(c => c.name).join(' → ')}`);

    // Execute attacks in speed order
    for (const character of turnOrder) {
      if (isPaused) {
        setIsExecuting(false);
        return;
      }

      const isPlayerChar = character.team === 'player';
      const currentChar = isPlayerChar
        ? playerTeamRef.current.find(p => p.id === character.id)
        : enemyTeamRef.current.find(e => e.id === character.id);

      if (!currentChar || currentChar.hp <= 0) continue;

      // Check if character is stunned
      const charStatus = characterStatuses[character.id];
      if (charStatus?.stun && charStatus.stun > 0) {
        addLog(`${character.name} ถูกสตัน! ไม่สามารถโจมตีได้`);
        addCombatLog(`⚡ ${character.name} ถูกสตัน ข้ามเทิร์น`, 'info');
        await new Promise(r => setTimeout(r, 600));
        continue;
      }

      setActiveChar(character.id);

      // ฟังก์ชันช่วยในการเลือกเป้าหมายตามตำแหน่ง Grid (Axie Style)
      const selectTarget = (targets, strategy = 'default', attackerPos = 4) => {
        const livingTargets = targets.filter(t => t.hp > 0);
        if (livingTargets.length === 0) return null;

        // 1. ถ้ามีกลยุทธ์เฉพาะที่ระบุใน Card Data
        if (strategy === 'lowest_hp') return [...livingTargets].sort((a, b) => a.hp - b.hp)[0];
        if (strategy === 'highest_hp') return [...livingTargets].sort((a, b) => b.hp - a.hp)[0];
        if (strategy === 'back') {
          // หา Column หลังสุดที่มีตัวละคร (0 คือหลังสุด)
          const backCols = [0, 1, 2];
          for (const col of backCols) {
            const inCol = livingTargets.filter(t => t.position % 3 === col);
            if (inCol.length > 0) return inCol[Math.floor(Math.random() * inCol.length)];
          }
        }
        if (strategy === 'front') {
          // หา Column หน้าสุดที่มีตัวละคร (2 คือหน้าสุด)
          const frontCols = [2, 1, 0];
          for (const col of frontCols) {
            const inCol = livingTargets.filter(t => t.position % 3 === col);
            if (inCol.length > 0) return inCol[Math.floor(Math.random() * inCol.length)];
          }
        }

        // 2. กลยุทธ์พื้นฐาน (Default): โจมตีตัวหน้าสุด (Front-most non-empty column)
        const priorityCols = [2, 1, 0]; // 2=Front, 1=Mid, 0=Back
        let targetCol = -1;
        for (const col of priorityCols) {
          if (livingTargets.some(t => t.position % 3 === col)) {
            targetCol = col;
            break;
          }
        }

        if (targetCol === -1) return livingTargets[0];

        const targetsInCol = livingTargets.filter(t => t.position % 3 === targetCol);

        // เลือกแถวที่ใกล้กับผู้โจมตีที่สุด (Attacker Row vs Target Row)
        const attackerRow = Math.floor(attackerPos / 3);
        return targetsInCol.sort((a, b) => {
          const rowA = Math.floor(a.position / 3);
          const rowB = Math.floor(b.position / 3);
          return Math.abs(rowA - attackerRow) - Math.abs(rowB - attackerRow);
        })[0];
      };


      if (isPlayerChar) {
        // Player character attacks
        const cardAction = cardsToUse.find(c => c.charId === character.id);
        if (!cardAction || cardAction.type === 'passive') continue;

        // Check for combo (multiple cards from same character)
        const comboCards = cardsToUse.filter(c => c.charId === character.id && c.type !== 'passive');
        const comboCount = comboCards.length;
        const comboBonus = comboCount > 1 ? 0.1 * (comboCount - 1) : 0; // 10% bonus per extra card

        setAnimationClass('attacking-left');
        addLog(`${character.name} ใช้ ${cardAction.name}${comboCount > 1 ? ` (COMBO x${comboCount}!)` : ''}`);
        addCombatLog(`${character.name} ใช้ ${cardAction.name}${comboCount > 1 ? ` 🔥 COMBO x${comboCount}` : ''}`, 'system');
        await new Promise(r => setTimeout(r, 400));

        // เลือกเป้าหมายจากศัตรู
        const targetStrategy = cardAction.targetType || 'default';
        const enemyTarget = selectTarget(enemyTeamRef.current, targetStrategy, character.position);

        if (enemyTarget) {
          // Show target indicator
          setTargetedEnemy(enemyTarget.id);
          await new Promise(r => setTimeout(r, 300));

          // Process all cards from this character
          for (const card of comboCards) {
            if (card.damage > 0) {
              const multiplier = getElementMultiplier(character.element, enemyTarget.element);
              let baseDamage = Math.round(card.damage * multiplier);
              
              // Apply combo bonus
              if (comboBonus > 0) {
                baseDamage = Math.round(baseDamage * (1 + comboBonus));
              }
              
              // Calculate CRIT (15% chance, 1.5x damage)
              const isCrit = Math.random() < 0.15;
              const finalDamage = isCrit ? Math.round(baseDamage * 1.5) : baseDamage;
              
              // Check shield
              const enemyShield = characterStatuses[enemyTarget.id]?.shield || 0;
              const damageToHP = Math.max(0, finalDamage - enemyShield);
              const damageToShield = Math.min(finalDamage, enemyShield);

              if (multiplier > 1 && card === comboCards[0]) {
                addLog(`⚡ ได้เปรียบธาตุ! ดาเมจ x${multiplier}`);
                addCombatLog(`⚡ ได้เปรียบธาตุ! x${multiplier}`, 'info');
              } else if (multiplier < 1 && card === comboCards[0]) {
                addLog(`⚠️ เสียเปรียบธาตุ! ดาเมจ x${multiplier}`);
                addCombatLog(`⚠️ เสียเปรียบธาตุ x${multiplier}`, 'info');
              }

              if (comboBonus > 0 && card === comboCards[0]) {
                addCombatLog(`🔥 โบนัส COMBO +${Math.round(comboBonus * 100)}%!`, 'info');
              }

              if (damageToShield > 0) {
                addCombatLog(`🛡️ ${enemyTarget.name} บล็อค ${damageToShield} ดาเมจ`, 'info');
                setCharacterStatuses(prev => ({
                  ...prev,
                  [enemyTarget.id]: {
                    ...prev[enemyTarget.id],
                    shield: enemyShield - damageToShield
                  }
                }));
              }

              if (damageToHP > 0) {
                setEnemyTeam(prev => prev.map(e => e.id === enemyTarget.id
                  ? { ...e, hp: Math.max(0, e.hp - damageToHP) }
                  : e
                ));
                
                // Trigger hit animation
                setCharacterEffects(prev => ({
                  ...prev,
                  [enemyTarget.id]: { type: 'hit' }
                }));
                setTimeout(() => {
                  setCharacterEffects(prev => {
                    const newEffects = { ...prev };
                    if (newEffects[enemyTarget.id]?.type === 'hit') {
                      delete newEffects[enemyTarget.id];
                    }
                    return newEffects;
                  });
                }, 400);
                
                showDamageNumber(enemyTarget.id, damageToHP, isCrit ? 'crit' : 'damage');
                addCombatLog(`${character.name} โจมตี ${enemyTarget.name} -${damageToHP} HP${isCrit ? ' CRIT!' : ''}${comboBonus > 0 ? ' (COMBO)' : ''}`, 'damage');
              }

              await new Promise(r => setTimeout(r, 300));
            }

            if (card.shield > 0) {
              let shieldAmount = card.shield;
              
              // Apply combo bonus to shield
              if (comboBonus > 0) {
                shieldAmount = Math.round(shieldAmount * (1 + comboBonus));
              }
              
              setPlayerTeam(prev => prev.map(p => p.id === character.id
                ? { ...p, shield: (p.shield || 0) + shieldAmount }
                : p
              ));
              setCharacterStatuses(prev => ({
                ...prev,
                [character.id]: {
                  ...prev[character.id],
                  shield: (prev[character.id]?.shield || 0) + shieldAmount
                }
              }));
              showDamageNumber(character.id, shieldAmount, 'heal');
              addCombatLog(`${character.name} ได้รับโล่ +${shieldAmount}${comboBonus > 0 ? ' (COMBO)' : ''}`, 'heal');
              await new Promise(r => setTimeout(r, 300));
            }
          }

          setTargetedEnemy(null);
        }
      } else {
        // Enemy character attacks
        setAnimationClass('attacking-right');
        addLog(`${character.name} กำลังเตรียมโจมตี...`);
        addCombatLog(`${character.name} เตรียมโจมตี`, 'system');
        await new Promise(r => setTimeout(r, 400));

        const playerTarget = selectTarget(playerTeamRef.current, 'default', character.position);

        if (playerTarget) {
          // Show target indicator
          setTargetedEnemy(playerTarget.id);
          await new Promise(r => setTimeout(r, 300));

          const multiplier = getElementMultiplier(character.element, playerTarget.element);
          const baseDamage = Math.round(character.attack * multiplier);
          
          // Enemy CRIT (10% chance)
          const isCrit = Math.random() < 0.10;
          const finalDamage = isCrit ? Math.round(baseDamage * 1.5) : baseDamage;
          
          // Check shield
          const playerShield = characterStatuses[playerTarget.id]?.shield || 0;
          const damageToHP = Math.max(0, finalDamage - playerShield);
          const damageToShield = Math.min(finalDamage, playerShield);

          if (damageToShield > 0) {
            addCombatLog(`🛡️ ${playerTarget.name} บล็อค ${damageToShield} ดาเมจ`, 'info');
            setCharacterStatuses(prev => ({
              ...prev,
              [playerTarget.id]: {
                ...prev[playerTarget.id],
                shield: playerShield - damageToShield
              }
            }));
          }

          if (damageToHP > 0) {
            setPlayerTeam(prev => prev.map(p => p.id === playerTarget.id
              ? { ...p, hp: Math.max(0, p.hp - damageToHP) }
              : p
            ));
            
            // Trigger hit animation
            setCharacterEffects(prev => ({
              ...prev,
              [playerTarget.id]: { type: 'hit' }
            }));
            setTimeout(() => {
              setCharacterEffects(prev => {
                const newEffects = { ...prev };
                if (newEffects[playerTarget.id]?.type === 'hit') {
                  delete newEffects[playerTarget.id];
                }
                return newEffects;
              });
            }, 400);
            
            showDamageNumber(playerTarget.id, damageToHP, isCrit ? 'crit' : 'damage');
            addCombatLog(`${character.name} โจมตี ${playerTarget.name} -${damageToHP} HP${isCrit ? ' CRIT!' : ''}`, 'damage');
          }

          setTargetedEnemy(null);
        }
      }

      setAnimationClass('');
      await new Promise(r => setTimeout(r, 400));

      // ตรวจสอบการจบเกมระหว่างเทิร์น (ใช้ Ref เพื่อข้อมูลที่ถูกต้อง)
      const currentEnemies = enemyTeamRef.current.filter(e => e.hp > 0).length;
      const currentPlayers = playerTeamRef.current.filter(p => p.hp > 0).length;
      if (currentEnemies === 0 || currentPlayers === 0) break;
    }

    setActiveChar(null);

    // Clear shields at end of turn (Axie Infinity style - shields last only 1 turn)
    setCharacterStatuses(prev => {
      const newStatuses = { ...prev };
      Object.keys(newStatuses).forEach(charId => {
        if (newStatuses[charId]?.shield) {
          delete newStatuses[charId].shield;
          addCombatLog(`โล่ของตัวละครหมดอายุ`, 'info');
        }
      });
      return newStatuses;
    });

    // Discard used cards from hand
    const usedInstanceIds = cardsToUse.map(c => c.instanceId);
    setHand(prevHand => prevHand.filter(c => !usedInstanceIds.includes(c.instanceId)));

    setSelectedCards([]);

    // ตรวจสอบผลลัพธ์หลังจากจบทุกการโจมตี
    const finalEnemies = enemyTeamRef.current.filter(e => e.hp > 0).length;
    const finalPlayers = playerTeamRef.current.filter(p => p.hp > 0).length;

    if (finalEnemies > 0 && finalPlayers > 0) {
      setEnergy(prev => Math.min(prev + 2, 10));
      setRound(prev => prev + 1);
      drawCards(3); // Draw 3 new cards each turn
      setTimeLeft(60);
      setHasUsedExtraTimeThisTurn(false);
    }

    setIsExecuting(false);
  }, [isExecuting, isPaused, playerTeam, enemyTeam, selectedCards, round, cardsDb, applyPassiveSkills, drawCards]);

  useEffect(() => {
    let interval;
    if (gameState === 'battle' && !isExecuting && !isPaused && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'battle' && timeLeft === 0 && !isExecuting && !isPaused) {
      executeTurn();
    }
    return () => clearInterval(interval);
  }, [timeLeft, isExecuting, isPaused, gameState, executeTurn]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLog(prev => [...prev, { user: 'Player', text: chatMessage }]);
    setChatMessage('');
  };

  const handleCardClick = (cardInHand) => {
    if (isExecuting || isPaused || cardInHand.type === 'passive') return;

    // Discard mode
    if (discardMode) {
      const isMarkedForDiscard = cardsToDiscard.some(c => c.instanceId === cardInHand.instanceId);
      if (isMarkedForDiscard) {
        setCardsToDiscard(prev => prev.filter(c => c.instanceId !== cardInHand.instanceId));
      } else {
        setCardsToDiscard(prev => [...prev, cardInHand]);
      }
      return;
    }

    // Normal card selection mode
    // Check if character is still alive
    const char = playerTeam.find(p => p.id === cardInHand.charId);
    if (!char || char.hp <= 0) return;

    const isSelected = selectedCards.some(c => c.instanceId === cardInHand.instanceId);

    if (isSelected) {
      setSelectedCards(prev => prev.filter(c => c.instanceId !== cardInHand.instanceId));
      setEnergy(prev => prev + cardInHand.energy);
      addCombatLog(`ยกเลิกการใช้ ${cardInHand.name}`, 'info');
    } else if (energy >= cardInHand.energy) {
      const newSelectedCards = [...selectedCards, cardInHand];
      setSelectedCards(newSelectedCards);
      setEnergy(prev => prev - cardInHand.energy);
      setEnergyAnimation(true);
      setTimeout(() => setEnergyAnimation(false), 600);
      
      // Check for combo
      const comboCount = newSelectedCards.filter(c => c.charId === cardInHand.charId).length;
      if (comboCount > 1) {
        addCombatLog(`🔥 COMBO! เลือกการ์ดของ ${char.name} ${comboCount} ใบ (+${(comboCount - 1) * 10}% โบนัส)`, 'system');
      } else {
        addCombatLog(`เลือกใช้ ${cardInHand.name} (พลังงาน: ${cardInHand.energy})`, 'info');
      }
    }
  };

  const toggleDiscardMode = () => {
    if (discardMode) {
      // Cancel discard mode
      setDiscardMode(false);
      setCardsToDiscard([]);
      addCombatLog('ยกเลิกการทิ้งการ์ด', 'info');
    } else {
      // Enter discard mode
      if (selectedCards.length > 0) {
        addCombatLog('⚠️ กรุณายกเลิกการเลือกการ์ดก่อนทิ้งการ์ด', 'info');
        return;
      }
      setDiscardMode(true);
      addCombatLog('🗑️ โหมดทิ้งการ์ด: เลือกการ์ดที่ต้องการทิ้ง', 'system');
    }
  };

  const confirmDiscard = () => {
    if (cardsToDiscard.length === 0) {
      addCombatLog('⚠️ กรุณาเลือกการ์ดที่ต้องการทิ้ง', 'info');
      return;
    }

    // Remove discarded cards from hand
    const discardedIds = cardsToDiscard.map(c => c.instanceId);
    setHand(prev => prev.filter(c => !discardedIds.includes(c.instanceId)));
    
    // Draw new cards to replace
    drawCards(cardsToDiscard.length);
    
    addCombatLog(`🗑️ ทิ้งการ์ด ${cardsToDiscard.length} ใบ และจั่วการ์ดใหม่`, 'system');
    
    // Reset discard mode
    setDiscardMode(false);
    setCardsToDiscard([]);
  };

  const totalPlayerHP = playerTeam.reduce((acc, c) => acc + c.hp, 0);
  const totalPlayerMaxHP = playerTeam.reduce((acc, c) => acc + c.maxHp, 0);
  const totalEnemyHP = enemyTeam.reduce((acc, c) => acc + c.hp, 0);
  const totalEnemyMaxHP = enemyTeam.reduce((acc, c) => acc + c.maxHp, 0);

  // Show loading screen while fetching data
  if (isLoadingData) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner">⚔️</div>
          <h2>กำลังโหลดข้อมูล...</h2>
          <p>กำลังเชื่อมต่อกับ Supabase Database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {showAdminPro && (
        <AdminPanelPro
          cards={cardsDb}
          setCards={setCardsDb}
          characters={characterPool}
          setCharacters={setCharacterPool}
          onClose={() => setShowAdminPro(false)}
        />
      )}
      <button
        className="admin-toggle-btn-pro"
        onClick={() => setShowAdminPro(!showAdminPro)}
        title="Admin Panel Pro"
      >
        <span className="admin-icon">🎮</span>
        <span className="admin-label">Admin</span>
      </button>

      {/* Landscape Hint for small portrait screens */}
      {typeof window !== 'undefined' && window.innerWidth < 500 && window.innerHeight < 700 && window.innerWidth < window.innerHeight && (
        <div className="landscape-hint">
          📱 หมุนหน้าจอเป็นแนวนอนเพื่อประสบการณ์ที่ดีขึ้น
        </div>
      )}

      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-modal">
            <h2>⏸️ เกมหยุดชั่วคราว</h2>
            <p>กดปุ่ม Resume เพื่อเล่นต่อ</p>
            <button className="btn-resume" onClick={togglePause}>
              ▶️ Resume
            </button>
          </div>
        </div>
      )}

      {gameState === 'victory' && (
        <div className="pause-overlay victory">
          <div className="result-screen victory-screen">
            <div className="result-particles"></div>
            <div className="result-glow"></div>
            
            <div className="result-icon victory-icon">
              <div className="icon-circle">
                <span className="icon-emoji">🏆</span>
              </div>
              <div className="icon-rays"></div>
            </div>
            
            <h1 className="result-title victory-title">VICTORY!</h1>
            <p className="result-subtitle">ชัยชนะอันยิ่งใหญ่</p>
            
            <div className="result-stats">
              <div className="stat-item">
                <div className="stat-label">รอบที่ใช้</div>
                <div className="stat-value">{round}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">ทีมรอดชีวิต</div>
                <div className="stat-value">{playerTeam.filter(p => p.hp > 0).length}/3</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">HP เหลือ</div>
                <div className="stat-value">{totalPlayerHP}</div>
              </div>
            </div>

            <div className="result-team">
              {playerTeam.map(char => (
                <div key={char.id} className={`result-char ${char.hp > 0 ? 'alive' : 'dead'}`}>
                  <div className="result-char-emoji">{char.emoji}</div>
                  <div className="result-char-hp">{char.hp > 0 ? `${char.hp} HP` : '💀'}</div>
                </div>
              ))}
            </div>
            
            <button className="btn-result victory-btn" onClick={resetGame}>
              <span className="btn-icon">🎮</span>
              <span>เล่นใหม่อีกครั้ง</span>
            </button>
            
            <button className="btn-result btn-home" onClick={() => setGameState('setup')}>
              <span className="btn-icon">🏠</span>
              <span>กลับหน้าแรก</span>
            </button>
          </div>
        </div>
      )}

      {gameState === 'defeat' && (
        <div className="pause-overlay defeat">
          <div className="result-screen defeat-screen">
            <div className="result-particles"></div>
            <div className="result-glow defeat-glow"></div>
            
            <div className="result-icon defeat-icon">
              <div className="icon-circle defeat-circle">
                <span className="icon-emoji">💀</span>
              </div>
              <div className="icon-cracks"></div>
            </div>
            
            <h1 className="result-title defeat-title">DEFEAT</h1>
            <p className="result-subtitle">พ่ายแพ้ในการต่อสู้</p>
            
            <div className="result-stats">
              <div className="stat-item">
                <div className="stat-label">รอบที่ใช้</div>
                <div className="stat-value">{round}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">ศัตรูเหลือ</div>
                <div className="stat-value">{enemyTeam.filter(e => e.hp > 0).length}/3</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">ใกล้ชนะ</div>
                <div className="stat-value">{Math.round((1 - totalEnemyHP / totalEnemyMaxHP) * 100)}%</div>
              </div>
            </div>

            <div className="result-team">
              {playerTeam.map(char => (
                <div key={char.id} className="result-char dead">
                  <div className="result-char-emoji">{char.emoji}</div>
                  <div className="result-char-hp">💀</div>
                </div>
              ))}
            </div>
            
            <button className="btn-result defeat-btn" onClick={resetGame}>
              <span className="btn-icon">🔄</span>
              <span>ลองใหม่อีกครั้ง</span>
            </button>
            
            <button className="btn-result btn-home" onClick={() => setGameState('setup')}>
              <span className="btn-icon">🏠</span>
              <span>กลับหน้าแรก</span>
            </button>
          </div>
        </div>
      )}


      <div className="ambient-bg" />

      <aside className="sidebar-left">
        <h1 className="brand">AXIE ARENA</h1>
        <div className="section-title">{gameState === 'setup' ? 'AVAILABLE POOL' : 'YOUR SQUAD'}</div>

        {gameState === 'setup' ? (
          <div className="setup-pool">
            {characterPool.map(char => {
              const isSelected = playerTeam.some(p => p.id === char.id);
              const elementInfo = ELEMENT_INFO[char.element];
              return (
                <div
                  key={char.id}
                  className={`char-mini setup-item ${isSelected ? 'selected' : ''} ${selectedCharToPlace?.id === char.id ? 'placing' : ''}`}
                  onClick={() => toggleSelectCharacter(char)}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, char)}
                  style={{ cursor: 'grab' }}
                >
                  <span className="char-mini-emoji">{char.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{char.name}</div>
                    <div style={{ fontSize: '0.7rem', color: elementInfo.color }}>
                      {elementInfo.emoji} {elementInfo.name} | Speed: {char.speed}
                    </div>
                    <div className="setup-item-skills">
                      {char.cards.slice(0, 2).map(cId => (
                        <span key={cId} className="mini-tag-sidebar">{cardsDb[cId]?.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          playerTeam.map(char => {
            const elementInfo = ELEMENT_INFO[char.element];
            return (
              <div key={char.id} className={`char-mini ${char.hp <= 0 ? 'dead' : ''}`}>
                <span className="char-mini-emoji">{char.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{char.name}</div>
                  <div style={{ fontSize: '0.65rem', color: elementInfo.color }}>
                    {elementInfo.emoji} {elementInfo.name}
                  </div>
                  <div className="char-mini-hp">HP {char.hp}/{char.maxHp}</div>
                </div>
              </div>
            );
          })
        )}
      </aside>

      <main className="main-content">
        {gameState === 'setup' ? (
          <div className="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 className="setup-title">จัดวางตำแหน่งทีม (3 ตัวละคร)</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                คลิกที่ตัวละครด้านซ้าย แล้วเลือกช่องในตาราง 9 ช่องเพื่อวางตำแหน่ง
              </p>
            </div>

            <div className="battle-grid player-grid">
              {[...Array(9)].map((_, i) => {
                const charInSlot = playerTeam.find(c => c.position === i);
                const isSelectedToPlace = selectedCharToPlace && playerTeam.some(c => c.id === selectedCharToPlace.id && c.position === i);

                return (
                  <div
                    key={i}
                    className={`grid-slot ${charInSlot ? 'occupied' : ''} ${selectedCharToPlace ? 'highlight' : ''}`}
                    onClick={() => handleSlotClick(i)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, i)}
                  >
                    {charInSlot ? (
                      <div className="char-on-grid" style={{ fontSize: '3rem' }}>
                        {charInSlot.emoji}
                        <div style={{
                          position: 'absolute',
                          bottom: '-10px',
                          background: 'rgba(0,0,0,0.8)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap'
                        }}>
                          {charInSlot.name}
                        </div>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.2, fontSize: '0.8rem' }}>{i}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                className={`btn-start-battle ${playerTeam.length === 3 ? 'ready' : ''}`}
                onClick={startBattle}
                disabled={playerTeam.length !== 3}
              >
                {playerTeam.length === 3 ? 'ยืนยันตำแหน่งและเข้าสู่สนามรบ!' : `ต้องการอีก ${3 - playerTeam.length} ตัวละคร`}
              </button>

              {playerTeam.length > 0 && (
                <button
                  onClick={() => setPlayerTeam([])}
                  style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6666', padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer' }}
                >
                  ล้างทีม
                </button>
              )}
            </div>
          </div>
        ) : (

          <>
            <header className="game-header">
              <div style={{ minWidth: '100px' }}>
                <span className="round-badge">ROUND {round}</span>
              </div>

              <div className="vs-master-group">
                <div className="vs-stat-bar">
                  <div className="hp-bar-wrap">
                    <div className="hp-fill player-fill" style={{ width: `${(totalPlayerHP / totalPlayerMaxHP) * 100}%` }} />
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 800 }}>{totalPlayerHP}</div>
                  </div>
                  <div className="vs-text">VS</div>
                  <div className="hp-bar-wrap">
                    <div className="hp-fill enemy-fill" style={{ width: `${(totalEnemyHP / totalEnemyMaxHP) * 100}%` }} />
                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 800 }}>{totalEnemyHP}</div>
                  </div>
                </div>

                <div className="turn-order-list">
                  {[...playerTeam, ...enemyTeam]
                    .filter(c => c.hp > 0)
                    .sort((a, b) => b.speed - a.speed)
                    .map(c => (
                      <span key={c.id} className={`order-icon ${activeChar === c.id ? 'active' : ''}`}>
                        {c.emoji}
                      </span>
                    ))
                  }
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className={`pause-btn ${pauseCharges === 0 && !isPaused ? 'disabled' : ''}`}
                  onClick={togglePause}
                  title={`หยุดเกม (เหลือ ${pauseCharges} ครั้ง)`}
                  style={{
                    background: isPaused ? 'var(--accent-cyan)' : 'var(--glass)',
                    border: '1px solid var(--glass-stroke)',
                    color: isPaused ? '#000' : '#fff',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '1rem',
                    cursor: (pauseCharges === 0 && !isPaused) ? 'not-allowed' : 'pointer',
                    opacity: (pauseCharges === 0 && !isPaused) ? 0.5 : 1
                  }}
                >
                  {isPaused ? '▶️ RESUME' : `⏸️ PAUSE (${pauseCharges})`}
                </button>
                <button
                  className={`extra-time-btn ${extraTimeCharges === 0 || hasUsedExtraTimeThisTurn ? 'disabled' : ''}`}
                  onClick={requestExtraTime}
                  style={{ background: 'var(--glass)', border: '1px solid var(--glass-stroke)', color: '#fff', borderRadius: '8px', padding: '5px 10px', fontSize: '0.8rem' }}
                >
                  +10s ({extraTimeCharges})
                </button>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', color: timeLeft <= 5 ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
                  {timeLeft}s
                </div>
              </div>
            </header>

            <section className="battle-stage">
              {/* PLAYER GRID */}
              <div className="battle-grid player-grid">
                {[...Array(9)].map((_, i) => {
                  const char = playerTeam.find(c => c.position === i);
                  if (!char) return <div key={i} className="grid-slot" style={{ opacity: 0.1 }}></div>;

                  const elementInfo = ELEMENT_INFO[char.element];
                  return (
                    <div key={char.id} className={`grid-slot occupied character-unit ${char.hp <= 0 ? 'dead' : ''} ${activeChar === char.id ? `active ${animationClass}` : ''} ${targetedEnemy === char.id ? 'target-locked' : ''} ${characterEffects[char.id]?.type === 'hit' ? 'hit-effect' : ''}`}>
                      {targetedEnemy === char.id && <div className="target-arrow">🎯</div>}
                      
                      <div className="sprite-box">
                        {char.image ? (
                          <div className="character-card-display">
                            <img src={char.image} alt={char.name} className="character-card-image" />
                          </div>
                        ) : (
                          <div className="character-emoji-display">{char.emoji}</div>
                        )}
                      </div>
                      <div className="char-shadow" />
                      
                      {characterEffects[char.id] && (
                        <div className={`dmg-text ${characterEffects[char.id].type}`}>
                          {characterEffects[char.id].value}
                          {characterEffects[char.id].type === 'crit' && <span style={{fontSize: '0.6em'}}> CRIT!</span>}
                        </div>
                      )}
                      
                      {/* Status Effects */}
                      {characterStatuses[char.id] && Object.keys(characterStatuses[char.id]).length > 0 && (
                        <div className="status-effects">
                          {characterStatuses[char.id].shield && (
                            <div className="status-icon" title={`Shield: ${characterStatuses[char.id].shield}`}>
                              🛡️
                              <span className="status-count">{characterStatuses[char.id].shield}</span>
                            </div>
                          )}
                          {characterStatuses[char.id].burn && (
                            <div className="status-icon" title={`Burn: ${characterStatuses[char.id].burn} turns`}>
                              🔥
                              <span className="status-count">{characterStatuses[char.id].burn}</span>
                            </div>
                          )}
                          {characterStatuses[char.id].stun && (
                            <div className="status-icon" title="Stunned">⚡</div>
                          )}
                        </div>
                      )}
                      
                      <div className="element-badge" style={{ background: elementInfo.color }}>{elementInfo.emoji}</div>

                      {/* Floating HP Bar for Grid */}
                      <div className="grid-hp-bar">
                        <div className="grid-hp-fill" style={{ width: `${(char.hp / char.maxHp) * 100}%`, background: elementInfo.color }} />
                        <span>{char.hp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '3rem', fontWeight: 900, opacity: 0.1, fontStyle: 'italic' }}>VS</div>

              {/* ENEMY GRID */}
              <div className="battle-grid enemy-grid">
                {[...Array(9)].map((_, i) => {
                  const char = enemyTeam.find(c => c.position === i);
                  if (!char) return <div key={i} className="grid-slot" style={{ opacity: 0.1 }}></div>;

                  const elementInfo = ELEMENT_INFO[char.element];
                  return (
                    <div key={char.id} className={`grid-slot occupied character-unit ${char.hp <= 0 ? 'dead' : ''} ${activeChar === char.id ? `active ${animationClass}` : ''} ${targetedEnemy === char.id ? 'target-locked' : ''} ${characterEffects[char.id]?.type === 'hit' ? 'hit-effect' : ''}`}>
                      {targetedEnemy === char.id && <div className="target-arrow">🎯</div>}
                      
                      <div className="sprite-box" style={{ transform: 'scaleX(-1)' }}>
                        {char.image ? (
                          <div className="character-card-display">
                            <img src={char.image} alt={char.name} className="character-card-image" />
                          </div>
                        ) : (
                          <div className="character-emoji-display">{char.emoji}</div>
                        )}
                      </div>
                      <div className="char-shadow" />
                      
                      {characterEffects[char.id] && (
                        <div className={`dmg-text ${characterEffects[char.id].type}`}>
                          {characterEffects[char.id].value}
                          {characterEffects[char.id].type === 'crit' && <span style={{fontSize: '0.6em'}}> CRIT!</span>}
                        </div>
                      )}
                      
                      {/* Status Effects */}
                      {characterStatuses[char.id] && Object.keys(characterStatuses[char.id]).length > 0 && (
                        <div className="status-effects">
                          {characterStatuses[char.id].shield && (
                            <div className="status-icon" title={`Shield: ${characterStatuses[char.id].shield}`}>
                              🛡️
                              <span className="status-count">{characterStatuses[char.id].shield}</span>
                            </div>
                          )}
                          {characterStatuses[char.id].burn && (
                            <div className="status-icon" title={`Burn: ${characterStatuses[char.id].burn} turns`}>
                              🔥
                              <span className="status-count">{characterStatuses[char.id].burn}</span>
                            </div>
                          )}
                          {characterStatuses[char.id].stun && (
                            <div className="status-icon" title="Stunned">⚡</div>
                          )}
                        </div>
                      )}
                      
                      <div className="element-badge" style={{ background: elementInfo.color }}>{elementInfo.emoji}</div>

                      <div className="grid-hp-bar">
                        <div className="grid-hp-fill" style={{ width: `${(char.hp / char.maxHp) * 100}%`, background: elementInfo.color }} />
                        <span>{char.hp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>


            <footer className="bottom-hand-section">
              <div className="action-row">
                <div className={`energy-orb ${energyAnimation ? 'energy-used' : ''}`}>⚡ {energy}/10</div>
                <div className="discard-controls">
                  {!discardMode ? (
                    <button 
                      className="btn-discard" 
                      onClick={toggleDiscardMode}
                      disabled={isExecuting || isPaused || selectedCards.length > 0}
                      title="ทิ้งการ์ดและจั่วใหม่"
                    >
                      🗑️ ทิ้งการ์ด
                    </button>
                  ) : (
                    <>
                      <button 
                        className="btn-confirm-discard" 
                        onClick={confirmDiscard}
                        disabled={cardsToDiscard.length === 0}
                      >
                        ✓ ยืนยันทิ้ง ({cardsToDiscard.length})
                      </button>
                      <button 
                        className="btn-cancel-discard" 
                        onClick={toggleDiscardMode}
                      >
                        ✕ ยกเลิก
                      </button>
                    </>
                  )}
                </div>
                <div className="end-turn-container">
                  <button className="btn-end-turn" onClick={() => executeTurn()} disabled={isExecuting || isPaused || discardMode}>
                    {isExecuting ? '...' : isPaused ? 'PAUSED' : discardMode ? 'DISCARD MODE' : 'END TURN'}
                  </button>
                </div>
              </div>

              <div className="battle-footer-content">
                {/* 1. PASSIVE SKILLS ROW (Fixed per character) */}
                <div className="passives-row">
                  {playerTeam.filter(p => p.hp > 0).map(char => {
                    const elementInfo = ELEMENT_INFO[char.element];
                    const passiveCard = char.cards.map(id => cardsDb[id]).find(c => c && c.type === 'passive');
                    if (!passiveCard) return null;
                    return (
                      <div key={`passive-${char.id}`} className="passive-badge" title={passiveCard.desc}>
                        <div className="passive-char-emoji" style={{ background: elementInfo.color }}>{char.emoji}</div>
                        <div className="passive-info">
                          <div className="passive-label">PASSIVE</div>
                          <div className="passive-name">{passiveCard.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. RANDOM HAND CARDS (Drawn from deck) */}
                <div className="hand-cards">
                  {hand.map((card) => {
                    const char = playerTeam.find(p => p.id === card.charId);
                    if (!char || char.hp <= 0) return null; // Only show cards for living characters

                    const elementInfo = ELEMENT_INFO[char.element];
                    const isSelected = selectedCards.some(s => s.instanceId === card.instanceId);
                    const isMarkedForDiscard = cardsToDiscard.some(c => c.instanceId === card.instanceId);
                    const comboCount = selectedCards.filter(c => c.charId === card.charId).length;
                    const isCombo = comboCount > 0 && !discardMode;

                    // ถ้ามีรูปการ์ด ให้แสดงรูปการ์ดแทน
                    if (card.image) {
                      return (
                        <div
                          key={card.instanceId}
                          className={`battle-card-image ${isSelected ? 'selected' : ''} ${isCombo ? 'combo-card' : ''} ${isMarkedForDiscard ? 'discard-marked' : ''}`}
                          onClick={() => handleCardClick(card)}
                        >
                          <img src={card.image} alt={card.name} className="skill-card-img" />
                          {isSelected && <div className="card-selected-overlay">✓</div>}
                          {isMarkedForDiscard && <div className="card-discard-overlay">🗑️</div>}
                          {isCombo && <div className="combo-badge">COMBO x{comboCount + 1}</div>}
                        </div>
                      );
                    }

                    // ถ้าไม่มีรูปการ์ด ให้แสดงแบบเดิม
                    return (
                      <div
                        key={card.instanceId}
                        className={`battle-card ${isSelected ? 'selected' : ''} ${isCombo ? 'combo-card' : ''} ${isMarkedForDiscard ? 'discard-marked' : ''} card-${card.type}`}
                        onClick={() => handleCardClick(card)}
                        style={{ borderColor: elementInfo.color }}
                      >
                        <div className="card-energy">{card.energy}</div>
                        <div className="card-type-badge">
                          {card.type === 'ultimate' ? '🔥' : '⚔️'}
                        </div>
                        <div className="card-char-icon" style={{ background: elementInfo.color }}>
                          {char.emoji}
                        </div>
                        <div className="card-title">{card.name}</div>
                        <div className="card-stats-vertical">
                          <div className={`stat-item ${card.damage >= 0 ? 'damage' : 'heal'}`}>
                            <div className="stat-left">
                              <span className="stat-icon">{card.damage >= 0 ? '⚔️' : '💚'}</span>
                            </div>
                            <span className="stat-value">{Math.abs(card.damage)}</span>
                          </div>
                          <div className="stat-item shield">
                            <div className="stat-left">
                              <span className="stat-icon">🛡️</span>
                            </div>
                            <span className="stat-value">{card.shield || 0}</span>
                          </div>
                        </div>
                        <div className="card-desc-container">
                          <div className="card-desc-text">{card.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </footer>
          </>
        )}
      </main>

      <aside className="sidebar-right">
        {gameState === 'battle' && (
          <div className="combat-log" ref={combatLogRef}>
            <div className="section-title">COMBAT LOG</div>
            {combatLogs.map((log, i) => (
              <div key={`${log.timestamp}-${i}`} className={`log-entry log-${log.type}`}>
                {log.msg}
              </div>
            ))}
            {combatLogs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', padding: '2rem' }}>
                รอการต่อสู้...
              </div>
            )}
          </div>
        )}
        
        <div className="chat-box" style={{ flex: gameState === 'battle' ? 0.8 : 1, marginBottom: 0 }}>
          <div className="section-title">TEAM CHAT</div>
          <div className="msg-list" ref={chatContainerRef}>
            {chatLog.map((chat, i) => {
              const isSticker = STICKERS.includes(chat.text);
              return (
                <div key={i} className="msg-item">
                  <div className="msg-user">{chat.user}</div>
                  <div style={{
                    wordBreak: 'break-word',
                    fontSize: isSticker ? '3rem' : 'inherit',
                    textAlign: isSticker ? 'center' : 'left',
                    lineHeight: isSticker ? '1' : 'inherit'
                  }}>{chat.text}</div>
                </div>
              );
            })}
          </div>

          <div className="sticker-panel">
            {STICKERS.map(s => <button key={s} className="sticker-btn" onClick={() => sendSticker(s)}>{s}</button>)}
          </div>

          <form onSubmit={handleSendMessage} style={{ marginTop: '1rem' }}>
            <input
              type="text"
              className="chat-input"
              style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-stroke)', color: '#fff' }}
              placeholder="Type message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            />
          </form>
        </div>
      </aside>
    </div>
  );
}

export default App;
