import { supabase } from './supabaseClient';

// ============================================
// CHARACTER OPERATIONS
// ============================================

/**
 * ดึงตัวละครทั้งหมด (พร้อมการ์ด)
 */
export async function getAllCharacters() {
  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // ดึงการ์ดของแต่ละตัวละคร
    const charactersWithCards = await Promise.all(
      (data || []).map(async (char) => {
        const cards = await getCharacterCards(char.id);
        return {
          ...char,
          cards
        };
      })
    );
    
    return charactersWithCards;
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
}

/**
 * สร้างตัวละครใหม่
 */
export async function createCharacter(characterData) {
  try {
    const { data, error } = await supabase
      .from('characters')
      .insert([{
        name: characterData.name,
        element: characterData.element,
        hp: characterData.hp,
        max_hp: characterData.maxHp || characterData.hp,
        attack: characterData.attack,
        speed: characterData.speed,
        emoji: characterData.emoji,
        class: characterData.class,
        ability: characterData.ability,
        image: characterData.image,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating character:', error);
    throw error;
  }
}

/**
 * อัปเดตตัวละคร
 */
export async function updateCharacter(id, updates) {
  try {
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating character:', error);
    throw error;
  }
}

/**
 * ลบตัวละคร
 */
export async function deleteCharacter(id) {
  try {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting character:', error);
    throw error;
  }
}

// ============================================
// CARD OPERATIONS
// ============================================

/**
 * ดึงการ์ดทั้งหมด
 */
export async function getAllCards() {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // แปลงเป็น object format เหมือนเดิม
    const cardsObject = {};
    data.forEach(card => {
      cardsObject[card.id] = {
        id: card.id,
        name: card.name,
        element: card.element,
        type: card.type,
        energy: card.energy,
        damage: card.damage,
        shield: card.shield,
        targetType: card.target_type,
        desc: card.description,
        image: card.image
      };
    });
    
    return cardsObject;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return {};
  }
}

/**
 * สร้างการ์ดใหม่
 */
export async function createCard(cardData) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .insert([{
        id: cardData.id,
        name: cardData.name,
        element: cardData.element,
        type: cardData.type,
        energy: cardData.energy,
        damage: cardData.damage,
        shield: cardData.shield,
        target_type: cardData.targetType,
        description: cardData.desc,
        image: cardData.image,
        character_id: cardData.characterId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
}

/**
 * ลบการ์ด
 */
export async function deleteCard(id) {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
}

// ============================================
// CHARACTER-CARD RELATIONSHIP
// ============================================

/**
 * เชื่อมโยงการ์ดกับตัวละคร
 */
export async function linkCardToCharacter(characterId, cardId, cardOrder) {
  try {
    const { data, error } = await supabase
      .from('character_cards')
      .insert([{
        character_id: characterId,
        card_id: cardId,
        card_order: cardOrder
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error linking card to character:', error);
    throw error;
  }
}

/**
 * ดึงการ์ดของตัวละคร
 */
export async function getCharacterCards(characterId) {
  try {
    const { data, error } = await supabase
      .from('character_cards')
      .select('card_id, card_order')
      .eq('character_id', characterId)
      .order('card_order', { ascending: true });

    if (error) throw error;
    return data.map(item => item.card_id);
  } catch (error) {
    console.error('Error fetching character cards:', error);
    return [];
  }
}

// ============================================
// BATCH OPERATIONS (สำหรับ Card Generator)
// ============================================

/**
 * สร้างตัวละครพร้อมการ์ดทั้งหมด (จาก Card Generator)
 */
export async function createCharacterWithCards(characterData, cardsData) {
  try {
    // 1. สร้างตัวละคร
    const character = await createCharacter(characterData);
    
    // 2. สร้างการ์ดทั้งหมด
    const cardIds = [];
    const cardOrder = ['passive', 'normal', 'support', 'ultimate'];
    
    for (const [index, cardType] of cardOrder.entries()) {
      const cardData = cardsData[cardType];
      if (cardData) {
        const card = await createCard({
          ...cardData,
          characterId: character.id
        });
        cardIds.push(card.id);
        
        // 3. เชื่อมโยงการ์ดกับตัวละคร
        await linkCardToCharacter(character.id, card.id, index);
      }
    }
    
    return {
      character: { ...character, cards: cardIds },
      cards: cardIds
    };
  } catch (error) {
    console.error('Error creating character with cards:', error);
    throw error;
  }
}
