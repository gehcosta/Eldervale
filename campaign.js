/* Domínio offline: counts usa "type:target"; materiais vêm da mochila atual.
 * accept, record, claim, purchase e sell alteram somente os objetos recebidos.
 * claim devolve a recompensa, sem aplicar ouro/XP/itens; runTests nunca é automático.
 */
(function () {
  'use strict';

  const own = (object, key) => object != null && Object.prototype.hasOwnProperty.call(object, key);
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const read = (object, key) => own(object, key) ? object[key] : undefined;
  const count = (value, cap) => Number.isFinite(value) ? Math.min(cap, Math.max(0, Math.floor(value))) : 0;
  const isQuantity = value => Number.isSafeInteger(value) && value >= 0;
  const keyOf = objective => objective.type + ':' + objective.target;

  function freeze(value) {
    Object.keys(value).forEach(key => {
      if (value[key] && typeof value[key] === 'object') freeze(value[key]);
    });
    return Object.freeze(value);
  }

  const MATERIALS = freeze({
    wood: { name: 'Madeira', label: 'Madeira', icon: '♣', color: '#b98c59' },
    ore: { name: 'Minério', label: 'Minério', icon: '◆', color: '#a6acb5' },
    herb: { name: 'Ervas', label: 'Ervas', icon: '♧', color: '#8fba77' },
    crystal: { name: 'Cristais', label: 'Cristais', icon: '❖', color: '#b7a5e8' },
    slimeGel: { name: 'Gel de slime', label: 'Gel de slime', icon: '●', color: '#79c5a4' }
  });
  const SITES = {
    'mine-0': { x: 54, y: 44 }, 'library-0': { x: 32, y: 20 },
    'watchtower-0': { x: 37, y: 47 }, 'mill-0': { x: 17, y: 42 },
    'temple-0': { x: 69, y: 57 }, 'camp-0': { x: 63, y: 38 },
    'sawmill-0': { x: 35, y: 39 }
  };
  const NPCS = {
    elder: { name: 'Elara', x: 26.8, y: 26.3 },
    merchant: { name: 'Brann', x: 28.3, y: 26.8 },
    ranger: { name: 'Aerin', x: 49, y: 30.3 },
    inn: { name: 'Mira', x: 23.2, y: 26.2 },
    scholar: { name: 'O estudioso', x: 32, y: 22 }
  };
  const SITE_NAMES = {
    'mine-0': 'a mina', 'library-0': 'a biblioteca', 'watchtower-0': 'a torre de vigia',
    'mill-0': 'o moinho', 'temple-0': 'o templo', 'camp-0': 'o acampamento',
    'sawmill-0': 'a serraria'
  };
  const MATERIAL_LOCATIONS = {
    wood: SITES['sawmill-0'], ore: SITES['mine-0'], crystal: SITES['mine-0'],
    herb: { x: 49, y: 30.3 }, slimeGel: { x: 38, y: 31 }
  };
  const ENEMIES = {
    slime: { name: 'Slimes', x: 38, y: 31 },
    goblin: { name: 'Goblins', x: 63, y: 38 },
    dragon: { name: 'Vyrath', x: 77, y: 16 }
  };
  const VISIT_TARGETS = Object.keys(SITES).concat('observatory');
  const talk = target => ({
    type: 'talk', target, amount: 1, label: 'Conversar com ' + NPCS[target].name,
    location: { x: NPCS[target].x, y: NPCS[target].y }
  });
  const visit = target => ({
    type: 'visit', target, amount: 1, label: 'Visitar ' + SITE_NAMES[target],
    location: { x: SITES[target].x, y: SITES[target].y }
  });
  const collect = (target, amount) => ({
    type: 'collect', target, amount, label: 'Reunir ' + MATERIALS[target].name.toLowerCase(),
    location: { x: MATERIAL_LOCATIONS[target].x, y: MATERIAL_LOCATIONS[target].y }
  });
  const kill = (target, amount) => ({
    type: 'kill', target, amount, label: 'Superar ' + ENEMIES[target].name,
    location: { x: ENEMIES[target].x, y: ENEMIES[target].y }
  });

  const QUESTS = freeze([
    {
      id: 'first-light', title: 'A primeira luz', chapter: 1, kind: 'main', giver: 'merchant', requires: null,
      description: 'Conheça Elara e Brann e reúna os materiais para preparar a jornada.',
      objectives: [talk('elder'), talk('merchant'), collect('wood', 4), collect('ore', 3)],
      reward: { gold: 80, xp: 100, talents: 0, items: ['ironSword'] }
    },
    {
      id: 'open-trails', title: 'Caminhos abertos', chapter: 2, kind: 'main', giver: 'elder', requires: 'first-light',
      description: 'Abra as trilhas da floresta e converse com Aerin sobre o que há além da vila.',
      objectives: [kill('slime', 4), kill('goblin', 3), talk('ranger')],
      reward: { gold: 100, xp: 120, talents: 1, items: ['chainmail'] }
    },
    {
      id: 'ancient-echoes', title: 'Ecos ancestrais', chapter: 3, kind: 'main', giver: 'scholar', requires: 'open-trails',
      description: 'Investigue os marcos antigos e leve cristais e ervas ao estudioso da biblioteca.',
      objectives: [visit('mine-0'), visit('library-0'), visit('watchtower-0'), talk('scholar'), collect('crystal', 3), collect('herb', 3)],
      reward: { gold: 160, xp: 180, talents: 0, items: ['mysticRobe'] }
    },
    {
      id: 'rekindle', title: 'Reacender o vale', chapter: 4, kind: 'main', giver: 'merchant', requires: 'ancient-echoes',
      description: 'Ajude Brann a reacender a forja com os recursos das trilhas recuperadas.',
      objectives: [collect('ore', 4), collect('wood', 3), collect('slimeGel', 3), talk('merchant')],
      reward: { gold: 180, xp: 150, talents: 1, items: ['moonBlade'] }
    },
    {
      id: 'emerald-oath', title: 'O juramento esmeralda', chapter: 5, kind: 'main', giver: 'elder', requires: 'rekindle',
      description: 'Encontre Vyrath na Coroa das Cinzas e retorne a Elara para selar o juramento do vale.',
      objectives: [kill('dragon', 1), talk('elder')],
      reward: { gold: 300, xp: 650, talents: 0, items: ['dragonBlade', 'dragonArmor'] }
    },
    {
      id: 'mira-supplies', title: 'Suprimentos para Mira', chapter: 1, kind: 'side', giver: 'inn', requires: null,
      description: 'Mira precisa de ervas e madeira para acolher os viajantes na estalagem.',
      objectives: [collect('herb', 4), collect('wood', 4)],
      reward: { gold: 60, xp: 80, talents: 0, items: [], potions: 2 }
    },
    {
      id: 'ranger-bounty', title: 'A recompensa do batedor', chapter: 2, kind: 'side', giver: 'ranger', requires: null,
      description: 'Ajude Aerin a conter os goblins e reconheça o acampamento da fronteira.',
      objectives: [kill('goblin', 5), visit('camp-0')],
      reward: { gold: 100, xp: 150, talents: 0, items: ['ironShield'] }
    },
    {
      id: 'old-stones', title: 'Pedras antigas', chapter: 3, kind: 'side', giver: 'scholar', requires: null,
      description: 'Trace para o estudioso a história das pedras da mina, do moinho, da torre e do templo.',
      objectives: [visit('mine-0'), visit('mill-0'), visit('watchtower-0'), visit('temple-0')],
      reward: { gold: 200, xp: 250, talents: 0, items: ['crystalShield'] }
    }
  ]);
  const MAIN_QUESTS = QUESTS.filter(quest => quest.kind === 'main');
  const QUEST_BY_ID = Object.create(null);
  QUESTS.forEach(quest => { QUEST_BY_ID[quest.id] = quest; });
  const questById = id => typeof id === 'string' && own(QUEST_BY_ID, id) ? QUEST_BY_ID[id] : null;

  function entry(state, id) {
    if (!questById(id) || !isObject(state) || !isObject(read(state, 'quests'))) return null;
    const value = read(state.quests, id);
    return isObject(value) && isObject(read(value, 'counts')) ? value : null;
  }

  function prerequisitesMet(state, quest) {
    while (quest.requires) {
      const prerequisite = entry(state, quest.requires);
      if (!prerequisite || read(prerequisite, 'claimed') !== true) return false;
      quest = questById(quest.requires);
    }
    return true;
  }

  function hydrateHistory(state, quest) {
    const value = entry(state, quest.id);
    if (!value || value.accepted !== true || value.claimed === true) return;
    quest.objectives.forEach(objective => {
      const history = objective.type === 'talk' ? state.talked : objective.type === 'visit' ? state.visited : null;
      if (Array.isArray(history) && history.includes(objective.target)) value.counts[keyOf(objective)] = objective.amount;
    });
  }

  function createState(legacyQuestFlags = null) {
    const state = { quests: {}, tracked: 'first-light', visited: [], talked: [] };
    QUESTS.forEach(quest => {
      state.quests[quest.id] = { accepted: quest.id === 'first-light', claimed: false, counts: {} };
    });
    if (!isObject(legacyQuestFlags)) return state;
    const legacy = legacyQuestFlags;
    const slimes = count(read(legacy, 'slimes'), 4);
    const goblins = count(read(legacy, 'goblins'), 3);
    const dragon = count(read(legacy, 'dragon'), 1);
    const ward = read(legacy, 'wardReward') === true;
    // ward sem recompensa final preserva o dragão vencido e o resgate ainda pendente.
    const completed = read(legacy, 'finalReward') === true || (!ward && dragon === 1);
    const partial = read(legacy, 'accepted') === true || slimes > 0 || goblins > 0;
    const claimedCount = completed ? 5 : ward ? 4 : partial ? 1 : 0;
    MAIN_QUESTS.slice(0, claimedCount).forEach(quest => {
      state.quests[quest.id].accepted = true;
      state.quests[quest.id].claimed = true;
    });
    const current = MAIN_QUESTS[claimedCount];
    state.tracked = current ? current.id : null;
    if (current) state.quests[current.id].accepted = true;
    if (partial || ward || completed) {
      state.quests['open-trails'].counts = { 'kill:slime': slimes, 'kill:goblin': goblins };
      state.quests['emerald-oath'].counts = { 'kill:dragon': dragon };
    }
    return state;
  }

  function currentQuest(state) {
    if (!isObject(state) || !isObject(read(state, 'quests'))) return null;
    return MAIN_QUESTS.find(quest => read(entry(state, quest.id), 'claimed') !== true) || null;
  }

  function trackedFallback(state) {
    const main = currentQuest(state);
    if (main) return main.id;
    const side = QUESTS.find(quest => {
      const value = entry(state, quest.id);
      return value && value.accepted === true && value.claimed !== true && prerequisitesMet(state, quest);
    });
    return side ? side.id : null;
  }

  function normalizeHistory(source, known) {
    return Array.isArray(source) ? Array.from(new Set(source.filter(id => typeof id === 'string' && known.includes(id)))) : [];
  }

  function normalizeState(source, legacyFlags = null) {
    const input = isObject(source) ? source : {};
    const inputQuests = isObject(read(input, 'quests')) ? input.quests : {};
    // Estado de campanha existente é autoritativo; flags v1 servem apenas na importação.
    const isCampaignState = QUESTS.some(quest => isObject(read(inputQuests, quest.id)));
    const state = isCampaignState ? createState() : createState(legacyFlags);
    state.visited = normalizeHistory(read(input, 'visited'), VISIT_TARGETS);
    state.talked = normalizeHistory(read(input, 'talked'), Object.keys(NPCS));
    QUESTS.forEach(quest => {
      const saved = read(inputQuests, quest.id);
      if (!isObject(saved)) return;
      const value = state.quests[quest.id];
      value.claimed = value.claimed || read(saved, 'claimed') === true;
      value.accepted = value.accepted || value.claimed || read(saved, 'accepted') === true;
      const counters = isObject(read(saved, 'counts')) ? saved.counts : {};
      quest.objectives.filter(objective => objective.type !== 'collect').forEach(objective => {
        const key = keyOf(objective);
        if (own(counters, key)) value.counts[key] = Math.max(count(read(value.counts, key), objective.amount), count(counters[key], objective.amount));
      });
    });
    // Uma recompensa já recebida também prova os pré-requisitos; nunca a reabrir.
    MAIN_QUESTS.forEach(quest => {
      if (!state.quests[quest.id].claimed) return;
      let previous = quest;
      while (previous.requires) {
        previous = questById(previous.requires);
        state.quests[previous.id].accepted = true;
        state.quests[previous.id].claimed = true;
      }
    });
    QUESTS.forEach(quest => {
      const value = state.quests[quest.id];
      if (!prerequisitesMet(state, quest)) value.accepted = false;
      if (!value.accepted) value.counts = {};
    });
    const main = currentQuest(state);
    if (main) state.quests[main.id].accepted = true;
    QUESTS.forEach(quest => hydrateHistory(state, quest));
    const tracked = questById(read(input, 'tracked'));
    const trackedEntry = tracked && entry(state, tracked.id);
    state.tracked = trackedEntry && trackedEntry.accepted && !trackedEntry.claimed ? tracked.id : trackedFallback(state);
    return state;
  }

  // Uma missão aceita continua disponível; accept retorna false ao aceitá-la novamente.
  function isAvailable(state, id) {
    const quest = questById(id), value = entry(state, id);
    return !!(quest && value && read(value, 'claimed') !== true && prerequisitesMet(state, quest));
  }

  function accept(state, id) {
    const value = entry(state, id);
    if (!isAvailable(state, id) || value.accepted === true) return false;
    value.accepted = true;
    hydrateHistory(state, questById(id));
    state.tracked = id;
    return true;
  }

  function progress(state, id, materials) {
    const quest = questById(id), value = entry(state, id);
    if (!quest) return [];
    return quest.objectives.map(objective => {
      let current = 0;
      if (value && value.claimed === true) current = objective.amount;
      else if (objective.type === 'collect') current = count(read(materials, objective.target), objective.amount);
      else {
        if (value && value.accepted === true) current = count(read(value.counts, keyOf(objective)), objective.amount);
        const history = objective.type === 'talk' ? read(state, 'talked') : objective.type === 'visit' ? read(state, 'visited') : null;
        if (Array.isArray(history) && history.includes(objective.target)) current = objective.amount;
      }
      return { ...objective, location: { ...objective.location }, current, complete: current >= objective.amount };
    });
  }

  function materialCosts(quest) {
    const costs = {};
    quest.objectives.filter(objective => objective.type === 'collect').forEach(objective => {
      costs[objective.target] = (costs[objective.target] || 0) + objective.amount;
    });
    return costs;
  }

  function isReady(state, id, materials) {
    const quest = questById(id), value = entry(state, id);
    if (!isAvailable(state, id) || value.accepted !== true) return false;
    if (!progress(state, id, materials).every(objective => objective.complete)) return false;
    const costs = materialCosts(quest);
    return Object.keys(costs).every(target => isObject(materials) && isQuantity(read(materials, target)) && materials[target] >= costs[target]);
  }

  function record(state, event) {
    if (!isObject(state) || !isObject(read(state, 'quests')) || !isObject(event)) return false;
    const type = read(event, 'type'), target = read(event, 'target');
    const amount = read(event, 'amount') === undefined ? 1 : event.amount;
    if (!Number.isSafeInteger(amount) || amount <= 0 || typeof target !== 'string') return false;
    const known = type === 'talk' ? own(NPCS, target) : type === 'visit' ? VISIT_TARGETS.includes(target) : type === 'kill' ? own(ENEMIES, target) : false;
    if (!known) return false;
    let isChanged = false;
    if (type === 'talk' || type === 'visit') {
      const history = read(state, type === 'talk' ? 'talked' : 'visited');
      if (!Array.isArray(history)) return false;
      if (!history.includes(target)) { history.push(target); isChanged = true; }
    }
    QUESTS.forEach(quest => {
      const value = entry(state, quest.id);
      if (!value || value.accepted !== true || value.claimed === true || !prerequisitesMet(state, quest)) return;
      quest.objectives.forEach(objective => {
        if (objective.type !== type || objective.target !== target) return;
        const key = keyOf(objective), before = count(read(value.counts, key), objective.amount);
        const after = Math.min(objective.amount, before + Math.min(amount, objective.amount));
        if (after !== before) { value.counts[key] = after; isChanged = true; }
      });
    });
    return isChanged;
  }

  function claim(state, id, materials) {
    if (!isReady(state, id, materials)) return null;
    const quest = questById(id), costs = materialCosts(quest);
    const reward = { ...quest.reward, items: quest.reward.items.slice() };
    // Toda validação ocorre antes de consumir qualquer recurso ou marcar a recompensa.
    Object.keys(costs).forEach(target => { materials[target] -= costs[target]; });
    state.quests[id].claimed = true;
    if (quest.kind === 'main') {
      const next = currentQuest(state);
      if (next) {
        state.quests[next.id].accepted = true;
        hydrateHistory(state, next);
      }
      state.tracked = trackedFallback(state);
    } else if (state.tracked === id) state.tracked = trackedFallback(state);
    return reward;
  }

  function itemById(catalog, id) {
    const item = typeof id === 'string' && isObject(catalog) ? read(catalog, id) : null;
    return isObject(item) && Number.isSafeInteger(read(item, 'price')) && item.price > 0 ? item : null;
  }

  function isEquipped(player, id) {
    const equipment = read(player, 'equipment');
    return isObject(equipment) && Object.keys(equipment).some(slot => equipment[slot] === id);
  }

  function purchase(player, id, catalog) {
    if (!isObject(player) || !isQuantity(read(player, 'gold'))) return false;
    if (id === 'potion') {
      if (player.gold < 18 || !isQuantity(read(player, 'potions')) || player.potions >= 99) return false;
      player.gold -= 18;
      player.potions++;
      return true;
    }
    const item = itemById(catalog, id);
    if (!item || !Array.isArray(read(player, 'inventory')) || player.gold < item.price || player.inventory.includes(id) || isEquipped(player, id)) return false;
    player.gold -= item.price;
    player.inventory.push(id);
    return true;
  }

  function sell(player, id, catalog) {
    if (!isObject(player) || !isQuantity(read(player, 'gold')) || !Array.isArray(read(player, 'inventory'))) return false;
    const item = itemById(catalog, id);
    if (!item || id === 'potion' || item.rarity === 'legendary' || id === 'dragonBlade' || id === 'dragonArmor' || isEquipped(player, id)) return false;
    const index = player.inventory.indexOf(id), proceeds = Math.floor(item.price * 0.4);
    if (index < 0 || !Number.isSafeInteger(player.gold + proceeds)) return false;
    player.inventory.splice(index, 1);
    player.gold += proceeds;
    return true;
  }

  function runTests(catalog) {
    const results = [];
    const shop = catalog == null ? {
      ironSword: { slot: 'weapon', price: 80, rarity: 'uncommon' },
      dragonBlade: { slot: 'weapon', price: 600, rarity: 'legendary' },
      dragonArmor: { slot: 'armor', price: 500, rarity: 'legendary' }
    } : catalog;
    const assert = (condition, message) => { if (!condition) throw new Error(message || 'Verificação falhou'); };
    const equal = (actual, expected) => assert(JSON.stringify(actual) === JSON.stringify(expected), 'Valores diferentes');
    const bag = () => ({ wood: 20, ore: 20, herb: 20, crystal: 20, slimeGel: 20 });
    const player = () => ({ gold: 1000, inventory: [], equipment: {}, potions: 0 });
    const objectiveProgress = (state, id, target, materials) => progress(state, id, materials).find(objective => objective.target === target);
    function finish(state, id, materials) {
      questById(id).objectives.filter(objective => objective.type !== 'collect').forEach(objective => {
        record(state, { type: objective.type, target: objective.target, amount: objective.amount });
      });
      return claim(state, id, materials);
    }
    function test(name, body) {
      try { body(); results.push({ name, passed: true }); }
      catch (error) { results.push({ name, passed: false, error: error instanceof Error ? error.message : 'Falha no teste' }); }
    }

    test('CreateState_NewGame_RootAcceptedAndSidesPending', () => {
      const state = createState();
      assert(state.quests['first-light'].accepted && !state.quests['first-light'].claimed);
      assert(QUESTS.filter(quest => quest.kind === 'side').every(quest => !state.quests[quest.id].accepted));
      equal(state.visited, []); equal(state.talked, []);
      assert(currentQuest(state).id === 'first-light' && state.tracked === 'first-light');
      assert(MAIN_QUESTS.length === 5 && QUESTS.length === 8);
      assert(QUESTS.every(quest => quest.objectives.every(objective => Number.isFinite(objective.location.x) && Number.isFinite(objective.location.y))));
    });
    test('Accept_MissingPrerequisiteAndUnknownId_RejectsWithoutMutation', () => {
      const state = createState(), before = JSON.stringify(state);
      assert(!isAvailable(state, 'open-trails') && !accept(state, 'open-trails'));
      assert(!accept(state, 'constructor') && !isReady(state, 'unknown', bag()));
      assert(!accept(state, 'first-light'));
      equal(progress(state, 'unknown', bag()), []);
      assert(JSON.stringify(state) === before);
    });
    test('Claim_IncompleteMaterials_ConsumesNothingAtomically', () => {
      const state = createState(), materials = { wood: 4, ore: 2 };
      record(state, { type: 'talk', target: 'elder' }); record(state, { type: 'talk', target: 'merchant' });
      const beforeState = JSON.stringify(state), beforeBag = JSON.stringify(materials);
      assert(!isReady(state, 'first-light', materials) && claim(state, 'first-light', materials) === null);
      assert(JSON.stringify(state) === beforeState && JSON.stringify(materials) === beforeBag);
    });
    test('Claim_MissingConversation_LeavesMaterialsAndQuestUntouched', () => {
      const state = createState(), materials = bag(), before = JSON.stringify(materials);
      assert(claim(state, 'first-light', materials) === null);
      assert(JSON.stringify(materials) === before && !state.quests['first-light'].claimed);
      assert(claim(null, 'first-light', materials) === null && claim(state, 'constructor', materials) === null);
    });
    test('Claim_CompleteQuest_ConsumesMaterialsReturnsRewardAndAdvances', () => {
      const state = createState(), materials = bag();
      const reward = finish(state, 'first-light', materials);
      equal(reward, { gold: 80, xp: 100, talents: 0, items: ['ironSword'] });
      assert(materials.wood === 16 && materials.ore === 17 && materials.herb === 20);
      assert(state.quests['first-light'].claimed && state.quests['open-trails'].accepted);
      assert(currentQuest(state).id === 'open-trails' && state.tracked === 'open-trails');
      assert(progress(state, 'first-light', materials).every(objective => objective.complete));
    });
    test('Claim_AlreadyClaimed_NoDuplicateRewardOrConsumption', () => {
      const state = createState(), materials = bag(), reward = finish(state, 'first-light', materials);
      reward.items.push('invalid');
      const beforeState = JSON.stringify(state), beforeBag = JSON.stringify(materials);
      assert(claim(state, 'first-light', materials) === null && !isReady(state, 'first-light', materials));
      assert(JSON.stringify(state) === beforeState && JSON.stringify(materials) === beforeBag);
      equal(questById('first-light').reward.items, ['ironSword']);
    });
    test('Progress_CollectEventsAndSpentMaterials_UsesOnlyCurrentBag', () => {
      const state = createState(), materials = { wood: 4, ore: 3 };
      record(state, { type: 'talk', target: 'elder' }); record(state, { type: 'talk', target: 'merchant' });
      assert(!record(state, { type: 'collect', target: 'wood', amount: 99 }));
      assert(isReady(state, 'first-light', materials));
      materials.wood = 2;
      assert(objectiveProgress(state, 'first-light', 'wood', materials).current === 2);
      assert(!isReady(state, 'first-light', materials) && claim(state, 'first-light', materials) === null);
      materials.wood = '4'; assert(!isReady(state, 'first-light', materials));
      materials.wood = Infinity; assert(!isReady(state, 'first-light', materials));
      materials.wood = 4.5; assert(!isReady(state, 'first-light', materials));
      assert(!own(state.quests['first-light'].counts, 'collect:wood'));
    });
    test('Record_HistoryBeforeAcceptance_SatisfiesTalkAndVisitButNotKills', () => {
      const state = createState(), materials = bag();
      record(state, { type: 'talk', target: 'ranger' });
      record(state, { type: 'visit', target: 'camp-0' });
      assert(!record(state, { type: 'kill', target: 'goblin', amount: 5 }));
      assert(accept(state, 'ranger-bounty') && !accept(state, 'ranger-bounty'));
      assert(objectiveProgress(state, 'ranger-bounty', 'camp-0', materials).complete);
      assert(objectiveProgress(state, 'ranger-bounty', 'goblin', materials).current === 0);
      finish(state, 'first-light', materials);
      assert(objectiveProgress(state, 'open-trails', 'ranger', materials).complete);
      assert(objectiveProgress(state, 'open-trails', 'goblin', materials).current === 0);
      record(state, { type: 'kill', target: 'goblin', amount: 2 });
      assert(objectiveProgress(state, 'ranger-bounty', 'goblin', materials).current === 2);
      assert(objectiveProgress(state, 'open-trails', 'goblin', materials).current === 2);
    });
    test('Record_InvalidAndDuplicateEvents_AreIgnoredOrCapped', () => {
      const state = createState();
      const before = JSON.stringify(state);
      [null, { type: 'talk', target: '<script>' }, { type: 'kill', target: 'goblin', amount: NaN },
        { type: 'talk', target: 'elder', amount: 0 }, { type: 'visit', target: 'missing' },
        { type: 'talk', target: 'elder', amount: 1.5 }, { type: 'talk', target: 'elder', amount: '1' }]
        .forEach(event => assert(!record(state, event)));
      assert(JSON.stringify(state) === before);
      assert(record(state, { type: 'talk', target: 'elder', amount: 99 }));
      assert(!record(state, { type: 'talk', target: 'elder' }));
      equal(state.talked, ['elder']); assert(state.quests['first-light'].counts['talk:elder'] === 1);
      record(state, { type: 'visit', target: 'observatory' }); equal(state.visited, ['observatory']);
      accept(state, 'ranger-bounty'); record(state, { type: 'kill', target: 'goblin', amount: Number.MAX_SAFE_INTEGER });
      assert(state.quests['ranger-bounty'].counts['kill:goblin'] === 5);
    });
    test('Record_ClaimedQuest_CountersStayUnchanged', () => {
      const state = createState(), materials = bag();
      accept(state, 'ranger-bounty'); finish(state, 'ranger-bounty', materials);
      const before = JSON.stringify(state.quests['ranger-bounty']);
      record(state, { type: 'kill', target: 'goblin', amount: 2 }); record(state, { type: 'visit', target: 'camp-0' });
      assert(JSON.stringify(state.quests['ranger-bounty']) === before);
      assert(!accept(state, 'ranger-bounty') && claim(state, 'ranger-bounty', materials) === null);
    });
    test('Claim_SideQuest_ConsumesResourcesAndReturnsPotions', () => {
      const state = createState(), materials = { herb: 4, wood: 4, ore: 9, other: 7 };
      accept(state, 'mira-supplies');
      const reward = claim(state, 'mira-supplies', materials);
      equal(reward, { gold: 60, xp: 80, talents: 0, items: [], potions: 2 });
      equal(materials, { herb: 0, wood: 0, ore: 9, other: 7 });
      assert(state.tracked === 'first-light' && currentQuest(state).id === 'first-light');
    });
    test('Claim_AllMainQuests_FinalRewardsOnceAndNoCurrentQuest', () => {
      const state = createState(), materials = bag();
      const rewards = MAIN_QUESTS.map(quest => {
        assert(state.quests[quest.id].accepted && isAvailable(state, quest.id));
        const reward = finish(state, quest.id, materials); assert(reward !== null); return reward;
      });
      equal(rewards[4], { gold: 300, xp: 650, talents: 0, items: ['dragonBlade', 'dragonArmor'] });
      assert(currentQuest(state) === null && state.tracked === null);
      assert(MAIN_QUESTS.every(quest => claim(state, quest.id, materials) === null));
      assert(materials.wood === 13 && materials.ore === 13 && materials.crystal === 17 && materials.herb === 17 && materials.slimeGel === 17);
    });
    test('NormalizeState_InvalidKeysBooleansAndCounters_SanitizesWithoutMutatingSource', () => {
      const source = {
        quests: {
          'first-light': { accepted: false, claimed: true, counts: {} },
          'open-trails': { accepted: true, claimed: 'true', counts: { 'kill:slime': Infinity, 'kill:goblin': 999, 'talk:ranger': '1', unknown: 7 } },
          'rekindle': { accepted: 'true', claimed: 1, counts: { 'talk:merchant': 1 } },
          unknown: { accepted: true, claimed: true, counts: {} }
        },
        visited: ['mine-0', 'mine-0', 'observatory', '<script>', 3], talked: ['ranger', 'ranger', 'unknown'], tracked: 'old-stones'
      };
      const before = JSON.stringify(source), state = normalizeState(source);
      assert(JSON.stringify(source) === before);
      equal(Object.keys(state.quests), QUESTS.map(quest => quest.id));
      equal(state.visited, ['mine-0', 'observatory']); equal(state.talked, ['ranger']);
      equal(state.quests['open-trails'].counts, { 'kill:slime': 0, 'kill:goblin': 3, 'talk:ranger': 1 });
      assert(!state.quests['open-trails'].claimed && !state.quests.rekindle.accepted && !state.quests.rekindle.claimed);
      equal(state.quests.rekindle.counts, {}); assert(state.tracked === 'open-trails');
      equal(normalizeState(state), state);
    });
    test('NormalizeState_BrokenPrerequisitesAndCounterBounds_RepairsLocksAndPreservesClaims', () => {
      const locked = normalizeState({ quests: { 'ancient-echoes': { accepted: true, claimed: false, counts: { 'visit:mine-0': 1 } } } });
      assert(!locked.quests['ancient-echoes'].accepted); equal(locked.quests['ancient-echoes'].counts, {});
      const counts = normalizeState({ quests: {
        'first-light': { claimed: true }, 'open-trails': { accepted: true, counts: { 'kill:slime': -2, 'kill:goblin': 2.9 } }
      } });
      equal(counts.quests['open-trails'].counts, { 'kill:slime': 0, 'kill:goblin': 2 });
      const completed = normalizeState({ quests: { 'emerald-oath': { accepted: false, claimed: true } }, talked: {}, visited: 'mine-0' });
      assert(MAIN_QUESTS.every(quest => completed.quests[quest.id].claimed && completed.quests[quest.id].accepted));
      assert(currentQuest(completed) === null && claim(completed, 'emerald-oath', bag()) === null);
      equal(completed.visited, []); equal(completed.talked, []);
      equal(normalizeState(null), createState()); equal(normalizeState([]), createState());
    });
    test('CreateState_EmptyOrDefaultLegacyFlags_DoesNotMigrateNewGame', () => {
      equal(createState({}), createState());
      equal(createState({ accepted: false, slimes: 0, goblins: 0, dragon: 0, wardReward: false, finalReward: false }), createState());
      equal(createState({ accepted: 'true', slimes: '2', goblins: NaN, dragon: Infinity }), createState());
    });
    test('CreateState_PartialLegacy_MigratesWithoutReplayingFirstReward', () => {
      [ { accepted: true }, { slimes: 2, goblins: 1 }, { accepted: true, slimes: 99, goblins: 99 } ].forEach(legacy => {
        const state = createState(legacy);
        assert(state.quests['first-light'].claimed && state.quests['open-trails'].accepted);
        assert(state.tracked === 'open-trails' && claim(state, 'first-light', bag()) === null);
        assert(state.quests['open-trails'].counts['kill:slime'] === count(legacy.slimes, 4));
        assert(state.quests['open-trails'].counts['kill:goblin'] === count(legacy.goblins, 3));
      });
    });
    test('CreateState_WardAndFinalLegacy_PreservesPreviouslyGrantedRewards', () => {
      const ward = createState({ wardReward: true, dragon: 0 });
      assert(MAIN_QUESTS.slice(0, 4).every(quest => ward.quests[quest.id].claimed));
      assert(ward.quests['emerald-oath'].accepted && !ward.quests['emerald-oath'].claimed);
      assert(ward.quests['emerald-oath'].counts['kill:dragon'] === 0 && ward.tracked === 'emerald-oath');
      [ { finalReward: true }, { dragon: 1 }, { wardReward: true, dragon: 1, finalReward: true } ].forEach(legacy => {
        const state = createState(legacy);
        assert(MAIN_QUESTS.every(quest => state.quests[quest.id].claimed));
        assert(currentQuest(state) === null && claim(state, 'emerald-oath', bag()) === null);
      });
      const migrated = normalizeState(null, { wardReward: true });
      assert(MAIN_QUESTS.slice(0, 4).every(quest => migrated.quests[quest.id].claimed));
      assert(migrated.tracked === 'emerald-oath'); equal(normalizeState(migrated), migrated);
      const pendingFinal = createState({ wardReward: true, dragon: 1, finalReward: false });
      assert(pendingFinal.quests['emerald-oath'].accepted && !pendingFinal.quests['emerald-oath'].claimed);
      assert(pendingFinal.quests['emerald-oath'].counts['kill:dragon'] === 1);
      const restored = normalizeState(pendingFinal);
      assert(restored.quests['emerald-oath'].counts['kill:dragon'] === 1);
      record(restored, { type: 'talk', target: 'elder' });
      assert(claim(restored, 'emerald-oath', bag()) !== null);
    });
    test('NormalizeState_ExistingCampaignWithStaleLegacyFlags_DoesNotRemigrate', () => {
      const state = createState(), materials = bag();
      finish(state, 'first-light', materials);
      record(state, { type: 'kill', target: 'slime', amount: 2 });
      const restored = normalizeState(state, { wardReward: true, dragon: 1, finalReward: true });
      equal(restored, state);
      assert(!restored.quests['open-trails'].claimed && restored.quests['open-trails'].counts['kill:slime'] === 2);
      equal(normalizeState(createState(), { finalReward: true }), createState());
    });
    test('Progress_IntegrationShape_ReturnsAmountsCountersCompletionAndMaterialLabels', () => {
      const state = createState(), objectives = progress(state, 'first-light', bag());
      objectives.forEach(objective => {
        assert(Number.isSafeInteger(objective.amount) && Number.isSafeInteger(objective.current));
        assert(typeof objective.complete === 'boolean' && typeof objective.label === 'string');
      });
      Object.keys(MATERIALS).forEach(id => assert(MATERIALS[id].label === MATERIALS[id].name));
      ['elder', 'merchant', 'inn', 'ranger', 'scholar'].forEach(target => assert(record(state, { type: 'talk', target })));
      Object.keys(SITES).concat('observatory').forEach(target => assert(record(state, { type: 'visit', target })));
      assert(isAvailable(state, 'first-light') && state.quests['first-light'].accepted);
    });
    test('Claim_EmeraldOath_ElderTalkBeforeOrAfterDragonBothComplete', () => {
      [true, false].forEach(isTalkFirst => {
        const state = createState({ wardReward: true }), materials = bag();
        const first = isTalkFirst ? { type: 'talk', target: 'elder' } : { type: 'kill', target: 'dragon' };
        const second = isTalkFirst ? { type: 'kill', target: 'dragon' } : { type: 'talk', target: 'elder' };
        record(state, first); assert(!isReady(state, 'emerald-oath', materials));
        record(state, second); assert(isReady(state, 'emerald-oath', materials));
        assert(claim(state, 'emerald-oath', materials) !== null && claim(state, 'emerald-oath', materials) === null);
      });
      const state = createState(), materials = bag();
      record(state, { type: 'talk', target: 'elder' });
      MAIN_QUESTS.slice(0, 4).forEach(quest => assert(finish(state, quest.id, materials) !== null));
      assert(state.quests['emerald-oath'].counts['talk:elder'] === 1);
      record(state, { type: 'kill', target: 'dragon' });
      assert(claim(state, 'emerald-oath', materials) !== null);
    });
    test('Purchase_InsufficientFundsUnknownAndInvalidItem_NoMutation', () => {
      const subject = player(); subject.gold = shop.ironSword.price - 1;
      const before = JSON.stringify(subject);
      assert(!purchase(subject, 'ironSword', shop) && !purchase(subject, 'missing', shop) && !purchase(subject, 'constructor', shop));
      assert(!purchase(subject, 'invalid', { invalid: { price: NaN } }));
      assert(JSON.stringify(subject) === before);
      subject.gold = NaN; assert(!purchase(subject, 'ironSword', shop));
      assert(!purchase(null, 'ironSword', shop));
    });
    test('Purchase_KnownUniqueItem_DeductsOnceAndRejectsDuplicatesOrEquipped', () => {
      const subject = player(); subject.gold = shop.ironSword.price;
      assert(purchase(subject, 'ironSword', shop));
      assert(subject.gold === 0); equal(subject.inventory, ['ironSword']);
      subject.gold = 1000; const before = JSON.stringify(subject);
      assert(!purchase(subject, 'ironSword', shop) && JSON.stringify(subject) === before);
      subject.inventory = []; subject.equipment.weapon = 'ironSword';
      assert(!purchase(subject, 'ironSword', shop));
      assert(!own(subject, 'ammo'));
    });
    test('Purchase_Potion_FixedPriceCapacityAndInsufficientBalance', () => {
      const subject = player(); subject.gold = 18; subject.potions = 98;
      assert(purchase(subject, 'potion', { potion: { price: 1 } }));
      assert(subject.gold === 0 && subject.potions === 99);
      subject.gold = 100; assert(!purchase(subject, 'potion', shop) && subject.gold === 100);
      subject.potions = 0; subject.gold = 17;
      assert(!purchase(subject, 'potion', shop) && subject.potions === 0 && subject.gold === 17);
      delete subject.potions; assert(!purchase(subject, 'potion', shop));
      assert(!own(subject, 'ammo'));
    });
    test('Sell_EquippedLegendaryUnknownAndInvalid_RejectsWithoutMutation', () => {
      const subject = player(); subject.inventory = ['ironSword', 'dragonBlade', 'dragonArmor', 'invalid']; subject.equipment.weapon = 'ironSword';
      const before = JSON.stringify(subject);
      assert(!sell(subject, 'ironSword', shop) && !sell(subject, 'dragonBlade', shop) && !sell(subject, 'dragonArmor', shop));
      assert(!sell(subject, 'missing', shop) && !sell(subject, 'constructor', shop));
      assert(!sell(subject, 'invalid', { invalid: { price: -1 } }) && !sell(subject, 'potion', shop));
      assert(!sell(subject, 'dragonBlade', { dragonBlade: { price: 600, rarity: 'common' } }));
      assert(JSON.stringify(subject) === before);
      assert(!sell(null, 'ironSword', shop));
    });
    test('Sell_UnequippedItem_PaysFortyPercentAndPreservesAmmo', () => {
      const subject = player(); subject.inventory = ['ironSword']; subject.ammo = { arrows: 17 }; const ammo = subject.ammo;
      assert(sell(subject, 'ironSword', shop));
      assert(subject.gold === 1000 + Math.floor(shop.ironSword.price * 0.4)); equal(subject.inventory, []);
      assert(subject.ammo === ammo && subject.ammo.arrows === 17 && subject.potions === 0);
      assert(!sell(subject, 'ironSword', shop));
      const noAmmo = player(); noAmmo.inventory = ['ironSword'];
      assert(sell(noAmmo, 'ironSword', shop) && !own(noAmmo, 'ammo'));
    });
    return results;
  }

  window.EldervaleCampaign = Object.freeze({
    MATERIALS, QUESTS, createState, normalizeState, accept, isAvailable, isReady,
    progress, record, claim, currentQuest, purchase, sell, runTests
  });
}());
