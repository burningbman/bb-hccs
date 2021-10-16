import {
    abort,
    adv1,
    autosell,
    availableAmount,
    buy,
    chew,
    cliExecute,
    create,
    drink,
    eat,
    equip,
    equippedItem,
    familiarWeight,
    gametimeToInt,
    getProperty,
    handlingChoice,
    haveEffect,
    haveOutfit,
    haveSkill,
    inMultiFight,
    maximize,
    myAdventures,
    myBasestat,
    myBuffedstat,
    myClass,
    myFamiliar,
    myFullness,
    myHp,
    myInebriety,
    myLevel,
    myMaxhp,
    myMeat,
    myMp,
    mySpleenUse,
    myTurncount,
    numericModifier,
    outfit,
    print,
    restoreHp,
    restoreMp,
    runChoice,
    runCombat,
    setAutoAttack,
    sweetSynthesis,
    use,
    useFamiliar,
    userConfirm,
    useSkill,
    visitUrl,
    weightAdjustment,
} from 'kolmafia';
import {
    $class,
    $effect,
    $familiar,
    $item,
    $items,
    $location,
    $monster,
    $skill,
    $slot,
    $stat,
    get,
    have,
    Macro,
    Mood,
    set,
} from 'libram';
import {
    adventureWithCarolGhost,
    eatPizza,
    ensureCreateItem,
    ensureEffect,
    ensureItem,
    ensurePotionEffect,
    ensurePullEffect,
    ensureSewerItem,
    ensureSong,
    fax,
    getPropertyInt,
    mapAndSaberMonster,
    mapMonster,
    multiFightAutoAttack,
    pullIfPossible,
    sausageFightGuaranteed,
    setChoice,
    setClan,
    synthExp,
    synthItem,
    tryUse,
    useBestFamiliar,
    wishEffect,
} from './lib';

enum Test {
    HP = 1,
    MUS = 2,
    MYS = 3,
    MOX = 4,
    FAMILIAR = 5,
    WEAPON = 6,
    SPELL = 7,
    NONCOMBAT = 8,
    ITEM = 9,
    HOT_RES = 10,
    COIL_WIRE = 11,
    DONATE = 30,
}

interface TestObject {
    id: Test,
    spreadsheetTurns: number,
    getPredictedTurns: { (): number },
    doTestPrep: { (): void },
    maximizer: string
}

const CONTEXT: { updateOutfits: boolean } = { updateOutfits: false };
const GOD_LOB_MACRO = Macro.skill($skill`Curse of Weaksauce`).skill($skill`Saucestorm`).repeat();

function ensureMeteorShowerAndCarolGhostEffect() {
    if (!haveEffect($effect`Do You Crush What I Crush?`) || !haveEffect($effect`Meteor Showered`)) {
        equip($item`Fourth of May Cosplay Saber`);
        adventureWithCarolGhost($effect`Do You Crush What I Crush?`, Macro
            .skill($skill`Meteor Shower`)
            .skill($skill`Use the Force`)
        );
        if (handlingChoice()) runChoice(3);
    }
}

function upkeepHp() {
    if (myHp() < 0.8 * myMaxhp()) {
        cliExecute('hottub');
    }
}

function upkeepHpAndMp() {
    upkeepHp();
    if (myMp() < 500) {
        eat($item`magical sausage`);
    }
}

function doGuaranteedGoblin() {
    // kill a kramco for the sausage before coiling wire
    if (!haveEffect($effect`Feeling Lost`) && sausageFightGuaranteed()) {
        if (myMp() < 12) {
            restoreMp(20);
        }
        const offHand = equippedItem($slot`off-hand`);
        equip($item`Kramco Sausage-o-Matic™`);
        Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
            .trySkill($skill`Barrage of Tears`)
            .trySkill($skill`Spittoon Monsoon`)
            .trySkill($skill`Beach Combo`)
            .skill($skill`Saucestorm`)
            .repeat().setAutoAttack();
        adv1($location`Noob Cave`);
        equip(offHand);
    }
}

function testDone(testNum: number) {
    print(`Checking test ${testNum}...`);
    return get(`_hccsTestActual${testNum}`) !== -1;
}

function clickTestButton(test: Test) {
    const turnsBeforeTest = myTurncount();
    visitUrl('council.php');
    visitUrl(`choice.php?whichchoice=1089&option=${test}`);

    if (test !== Test.DONATE && myTurncount() === turnsBeforeTest) {
        throw `Failed to do test ${Test[test]}. Maybe we are out of turns.`;
    }

    set(`_hccsTestActual${test}`, myTurncount() - turnsBeforeTest);
}

function runTest(testId: Test) {
    const test = tests.find((test) => test.id === testId);
    if (test) {
        if (!testDone(testId)) {
            doGuaranteedGoblin();
            test.doTestPrep();
            if (CONTEXT.updateOutfits) {
                maximize(test.maximizer, false);
                cliExecute(`outfit save hccs_${Test[testId]}`);
            }
            else if (haveOutfit(`hccs_${Test[testId]}`)) {
                outfit(`hccs_${Test[testId]}`);
            }
            let predictedTurns = 60;
            if (testId !== Test.DONATE && testId !== Test.COIL_WIRE) {
                predictedTurns = test.getPredictedTurns();
                if (predictedTurns > test.spreadsheetTurns) {
                    if (!userConfirm(`${Test[testId]} taking ${predictedTurns} instead of ${test.spreadsheetTurns}. Continue?`)) {
                        throw 'Test taking too long.'
                    }
                }

                while (Math.max(1, predictedTurns) > myAdventures()) {
                    eat(1, $item`magical sausage`);
                }

                // [$slot`hat`, $slot`back`, $slot`weapon`, $slot`off-hand`, $slot`pants`, $slot`shirt`, $slot`acc1`, $slot`acc2`, $slot`acc3`, $slot`familiar`].forEach((slot) =>
                //     print(`${slot.toString()}: ${equippedItem(slot)}`)
                // )
            }
            set(`_hccsTestExpected${testId}`, predictedTurns);
            clickTestButton(testId);
        } else {
            print(`Test ${testId} already completed.`);
        }
    }
}

const getBatteries = () => {
    // use the power plant
    cliExecute('inv_use.php?pwd&whichitem=10738');

    for (let i = 1; i < 8; i++) {
        cliExecute(`choice.php?pwd&whichchoice=1448&option=1&pp=${i}`);
    }
};

const ensureDeepDarkVisions = () => {
    if (have($effect`Visions of the Deep Dark Deeps`)) return;
    // Deep Dark Visions
    useFamiliar($familiar`Exotic Parrot`);
    ensureEffect($effect`Feeling Peaceful`);
    cliExecute('retrocape vampire hold');

    upkeepHpAndMp();
    if (Math.round(numericModifier('spooky resistance')) < 10) {
        ensureEffect($effect`Does It Have a Skull In There??`);
        if (Math.round(numericModifier('spooky resistance')) < 10) {
            throw 'Not enough spooky res for Deep Dark Visions.';
        }
    }
    useSkill(1, $skill`Deep Dark Visions`);
}

function setup() {
    if (availableAmount($item`cracker`) > 0 || myLevel() > 1) return;

    set('bb_ScriptStartCS', gametimeToInt());
    set('autoSatisfyWithNPCs', true);
    set('autoSatisfyWithCoinmasters', true);
    set('hpAutoRecovery', .8);

    // reset actual counts for validation
    for (const test in Test) {
        set(`_hccsTestActual${Test[test]}`, -1);
    }

    setClan('Bonus Adventures from Hell');

    use($item`Bird-a-Day calendar`);

    // Sell pork gems + tent
    visitUrl('tutorial.php?action=toot');
    tryUse(1, $item`letter from King Ralph XI`);
    tryUse(1, $item`pork elf goodies sack`);
    autosell(5, $item`baconstone`);
    autosell(5, $item`porquoise`);
    autosell(5, $item`hamethyst`);

    visitUrl('council.php'); // Initialize council.
    visitUrl('clan_viplounge.php?action=fwshop'); // manual visit to fireworks shop to allow purchases
    visitUrl('clan_viplounge.php?action=lookingglass&whichfloor=2'); // get DRINK ME potion
    visitUrl('shop.php?whichshop=lathe&action=buyitem&quantity=1&whichrow=1162&pwd'); // lathe wand

    ensureItem(1, $item`toy accordion`);
    cliExecute('acquire bitchin meatcar');
    // ensureSewerItem(1, $item`turtle totem`);
    ensureSewerItem(1, $item`saucepan`);

    cliExecute('mood apathetic');
    cliExecute('ccs bb-hccs');
    cliExecute('backupcamera reverser on');
    cliExecute('backupcamera ml');
    cliExecute('mcd 10');
    cliExecute('retrocape mysticality hold');
    cliExecute('fold makeshift garbage shirt');
    cliExecute('boombox meat');

    setChoice(1340, 3); // Turn off Lil' Doctor quests.
    setChoice(1387, 3); // set saber to drop items
    setChoice(1410, 2); // pick mushroom

    // Upgrade saber for fam wt
    visitUrl('main.php?action=may4');
    runChoice(4);

    // pull and use borrowed time
    if (availableAmount($item`borrowed time`) === 0 && !get('_borrowedTimeUsed')) {
        if (pullIfPossible(1, $item`borrowed time`, 20000)) {
            use($item`borrowed time`);
        } else {
            abort('Couldn\'t get borrowed time');
        }
    }

    if (!get('_floundryItemCreated')) {
        cliExecute('acquire fish hatchet');
    }

    getBatteries();

    useSkill($skill`Summon Crimbo Candy`);
    useSkill($skill`Summon Sugar Sheets`, 3);

    // get blood-faced volleyball
    // cliExecute('acquire seal tooth');
    // cliExecute('acquire volleyball');
    // use($item`seal tooth`);
    // use($item`volleyball`);
    pullIfPossible(1, $item`cracker`, 2000);
    pullIfPossible(1, $item`dromedary drinking helmet`, 2000);
}

function getPizzaIngredients() {
    if (have($item`cherry`) || myLevel() > 1) return;

    // Put on some regen gear
    outfit('hccs_pizza');

    if (myHp() < myMaxhp()) {
        useSkill($skill`Cannelloni Cocoon`);
    }

    Macro.skill($skill`Feel Envy`).skill($skill`Chest X-Ray`).setAutoAttack();

    // Saber tomato (reagent potion)
    if (!have($item`tomato`)) {
        mapMonster($location`The Haunted Pantry`, $monster`possessed can of tomatoes`);
        runCombat();
    }

    // Cherry and grapefruit in skeleton store (Saber YR)
    if (getProperty('questM23Meatsmith') === 'unstarted') {
        visitUrl('shop.php?whichshop=meatsmith&action=talk');
        runChoice(1);
    }
    adv1($location`The Skeleton Store`);
    mapAndSaberMonster($location`The Skeleton Store`, $monster`novelty tropical skeleton`);
}

function useStatGains() {
    if (!have($item`a ten-percent bonus`)) return;

    outfit('hccs_pizza');

    if (get('getawayCampsiteUnlocked') && haveEffect($effect`That's Just Cloud-Talk, Man`) === 0) {
        visitUrl('place.php?whichplace=campaway&action=campaway_sky');
    }

    ensureEffect($effect`Inscrutable Gaze`);
    ensureEffect($effect`Thaumodynamic`);
    synthExp();
    ensurePullEffect($effect`Different Way of Seeing Things`, $item`non-Euclidean angle`);

    if (Math.round(numericModifier('mysticality experience percent')) < 125) {
        throw 'Insufficient +stat%.';
    }

    // Use ten-percent bonus
    tryUse(1, $item`a ten-percent bonus`);

    cliExecute('bastille myst brutalist');

    eat(1, $item`magical sausage`);
}

function buffBeforeGoblins() {
    if (have($effect`You Learned Something Maybe!`) || myLevel() >= 13) return;

    // craft potions after eating to ensure we have adventures
    if (!get('hasRange')) {
        ensureItem(1, $item`Dramatic™ range`);
        use(1, $item`Dramatic™ range`);
    }

    if (haveSkill($skill`Advanced Saucecrafting`)) useSkill(1, $skill`Advanced Saucecrafting`);
    ensurePotionEffect($effect`Tomato Power`, $item`tomato juice of powerful power`);
    ensurePotionEffect($effect`Mystically Oiled`, $item`ointment of the occult`);

    ensureEffect($effect`Favored by Lyle`);
    ensureEffect($effect`Starry-Eyed`);
    ensureEffect($effect`Triple-Sized`);
    ensureEffect($effect`Feeling Excited`);
    ensureEffect($effect`Uncucumbered`); // boxing daycare
    ensureSong($effect`The Magical Mojomuscular Melody`);
    ensureEffect($effect`Hulkien`);
    ensureEffect($effect`We're All Made of Starfish`);

    // Plan is for these buffs to fall all the way through to item -> hot res -> fam weight.
    ensureEffect($effect`Fidoxene`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Do I Know You From Somewhere?`);
    ensureEffect($effect`You Learned Something Maybe!`);

    if (!haveEffect($effect`Holiday Yoked`)) {
        adventureWithCarolGhost($effect`Holiday Yoked`);
    }
}

function fightGodLob() {
    upkeepHp();
    visitUrl("main.php?fightgodlobster=1");
    runCombat();
    multiFightAutoAttack();
    runChoice(-1);
}

function godLob() {
    if (get("_godLobsterFights") === 0) {
        outfit('hccs_freefights');
        equip($item`familiar scrapbook`); // don't try to find kramco here

        useFamiliar($familiar`God Lobster`);
        GOD_LOB_MACRO.setAutoAttack();
        setChoice(1310, 1);
        fightGodLob();
        equip($slot`familiar`, $item`God Lobster's Scepter`);
        fightGodLob();
        equip($slot`familiar`, $item`God Lobster's Ring`);
    }
}

function doFreeFights() {
    if (get('_chestXRayUsed') >= 3) return;

    cliExecute('retrocape mysticality hold');

    upkeepHp();

    ensureEffect($effect`Blessing of your favorite Bird`); // Should be 75% myst for now.
    ensureEffect($effect`Confidence of the Votive`); // PM candle
    ensureEffect($effect`Song of Bravado`);
    ensureSong($effect`Polka of Plenty`);
    ensureEffect($effect`Big`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Blood Bubble`);
    ensureEffect($effect`Drescher's Annoying Noise`);
    ensureEffect($effect`Elemental Saucesphere`);
    // ensureEffect($effect`Empathy`);
    ensureEffect($effect`Inscrutable Gaze`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Pride of the Puffin`);
    ensureEffect($effect`Singer's Faithful Ocelot`);
    haveSkill($skill`Stevedave's Shanty of Superiority`) &&
        ensureEffect($effect`Stevedave's Shanty of Superiority`);
    ensureEffect($effect`Ur-Kel's Aria of Annoyance`);
    ensureEffect($effect`Feeling Excited`);

    godLob();
    useBestFamiliar();
    outfit('hccs_freefights');

    // kill the mushroom
    if (!get('_mushroomGardenVisited')) {
        Macro.skill($skill`Barrage of Tears`)
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Saucestorm`)
            .repeat()
            .setAutoAttack();
        adv1($location`Your Mushroom Garden`);
    }

    // Neverending Party
    if (get('_questPartyFair') === 'unstarted') {
        setChoice(1322, 0);
        visitUrl('adventure.php?snarfblat=528');
        if (get('_questPartyFairQuest') === 'food') {
            runChoice(1);
            setChoice(1324, 2);
            setChoice(1326, 3);
        } else if (get('_questPartyFairQuest') === 'booze') {
            runChoice(1);
            setChoice(1324, 3);
            setChoice(1327, 3);
        } else {
            runChoice(2);
            setChoice(1324, 5);
        }
    }

    Macro.trySkill($skill`Feel Pride`)
        .skill($skill`Barrage of Tears`)
        .skill($skill`Sing Along`)
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`Saucestorm`).setAutoAttack();

    while (get('_neverendingPartyFreeTurns') < 10) {
        upkeepHp();
        adv1($location`The Neverending Party`);
        if (get('lastEncounter').includes('Gone Kitchin') || get('lastEncounter').includes('Forward to the Back')) {
            setChoice(1324, 5);
        }
    }

    if (get('_backUpUses') < 10) {
        if (!sausageFightGuaranteed()) {
            throw ('Sausage not ready for back-ups and kramco chain');
        }

        upkeepHp();
        equip($item`Kramco Sausage-o-Matic™`);
        Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
            .skill($skill`Barrage of Tears`)
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Sing Along`)
            .skill($skill`Saucestorm`).setAutoAttack();
        adv1($location`Noob Cave`);

        // back-up sausages in Noob Cave
        Macro.if_('!monstername "sausage goblin"', new Macro().skill($skill`Back-Up to your Last Enemy`))
            .if_('!monstername "sausage goblin"', new Macro().step('abort'))
            .trySkill($skill`Feel Pride`)
            .skill($skill`Barrage of Tears`)
            .skill($skill`Sing Along`)
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Saucestorm`).setAutoAttack();

        while (get('_backUpUses') < 10) {
            upkeepHp();
            adv1($location`Noob Cave`, -1, '');
        }

        upkeepHp();
    }

    if (get('_pocketProfessorLectures') === 0) {
        // need 2 adventures to lecture on relativity
        if (myAdventures() < 2) eat(1, $item`magical sausage`);

        // Professor chain off the last back-up
        equip($item`Fourth of May Cosplay Saber`);
        equip($slot`acc2`, $item`hewn moon-rune spoon`);
        useFamiliar($familiar`Pocket Professor`);

        Macro.trySkill($skill`Back-Up to your Last Enemy`)
            .skill($skill`Curse of Weaksauce`)
            .skill($skill`Entangling Noodles`)
            .skill($skill`Micrometeorite`)
            .trySkill(Skill.get('Lecture on Relativity'))
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Saucegeyser`)
            .setAutoAttack();
        adv1($location`The Dire Warren`);
        while (inMultiFight()) runCombat();
        setAutoAttack(0);

        upkeepHpAndMp();
    }

    equip($slot`acc2`, $item`Lil' Doctor™ bag`);
    Macro.if_('monstername "sausage goblin"', new Macro().skill($skill`Saucegeyser`).repeat())
        .trySkill($skill`Shattering Punch`)
        .trySkill($skill`Gingerbread Mob Hit`)
        .trySkill($skill`Chest X-Ray`).setAutoAttack();

    // Free kills in NEP
    while (get('_shatteringPunchUsed') < 3 ||
        !get('_gingerbreadMobHitUsed') ||
        get('_chestXRayUsed') < 3
    ) {
        useBestFamiliar();
        upkeepHpAndMp();
        adv1($location`The Neverending Party`);
    }

    cliExecute('fold wad of used tape'); // for stat and item tests
}

function doHpTest() {
    ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);
    cliExecute('retrocape muscle');
}

function doMoxTest() {
    if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Penne Dreadful`);
    else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

    ensureEffect($effect`Blessing of the Bird`); // SA/PM have moxie bird
    ensureEffect($effect`Big`);
    ensureEffect($effect`Song of Bravado`);
    // ensureSong($effect`Stevedave's Shanty of Superiority`);
    ensureSong($effect`The Moxious Madrigal`);
    ensureEffect($effect`Pomp & Circumsands`);
    if (have($item`runproof mascara`)) use($item`runproof mascara`);
    // ensureEffect($effect`Quiet Desperation`);
    // ensureEffect($effect`Disco Fever`);
    // ensureEffect($effect`Mariachi Mood`);
    cliExecute('retrocape moxie');

    if (myBuffedstat($stat`moxie`) - myBasestat($stat`moxie`) < 1770) {
        useSkill(1, $skill`Acquire Rhinestones`);
        use(availableAmount($item`rhinestone`), $item`rhinestone`);
    }
}

function doMusTest() {
    if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Undead Elbow Macaroni`);
    else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

    ensureEffect($effect`Big`);
    ensureEffect($effect`Song of Bravado`);
    ensureEffect($effect`Rage of the Reindeer`);
    ensureEffect($effect`Lack of Body-Building`);
    // ensureSong($effect`Stevedave's Shanty of Superiority`);
    // ensureSong($effect`Power Ballad of the Arrowsmith`);
    // ensureEffect($effect`Quiet Determination`);
    // ensureEffect($effect`Disdain of the War Snapper`);
    cliExecute('retrocape muscle');
}

function doItemTest() {
    ensureItem(1, $item`oversized sparkler`);

    // cyclops eyedrops
    if (!haveEffect($effect`One Very Clear Eye`)) {
        cliExecute('pillkeeper semirare');
        adv1($location`The Limerick Dungeon`);
        use($item`cyclops eyedrops`);
    }

    !get('_clanFortuneBuffUsed') && cliExecute('fortune buff item');
    !haveEffect($effect`Infernal Thirst`) && cliExecute('genie effect Infernal Thirst');
    !haveEffect($effect`Lantern-Charged`) && use($item`battery (lantern)`);
    synthItem();
    ensureEffect($effect`Singer's Faithful Ocelot`);
    ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
    ensureEffect($effect`The Spirit of Taking`);
    ensureEffect($effect`Steely-Eyed Squint`);
    ensureEffect($effect`Nearly All-Natural`); // bag of grain

    // ensureEffect($effect`Blessing of the Bird`);
    // ensureEffect($effect`El Aroma de Salsa`); // Salsa Caliente™ candle
}

function doFamiliarTest() {
    if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);

    // These should have fallen through all the way from leveling.
    ensureEffect($effect`Fidoxene`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);

    if (have($item`short stack of pancakes`)) use($item`short stack of pancakes`);

    equip($item`Fourth of May Cosplay Saber`);

    if (!have($effect`Meteor Showered`)) {
        Macro.skill($skill`Meteor Shower`).skill($skill`Use the Force`).setAutoAttack();
        adv1($location`The Dire Warren`);
        if (handlingChoice()) runChoice(3);
    }
}

function doWeaponTest() {
    ensureDeepDarkVisions(); // do this for spell test before getting cowrrupted

    if (!haveEffect($effect`Cowrruption`)) {
        if (get('camelSpit') >= 100) useFamiliar($familiar`Melodramedary`);
        Macro.trySkill($skill`%fn, spit on me!`)
            .skill($skill`Shocking Lick`)
            .setAutoAttack();
        fax($monster`ungulith`);
        use($item`photocopied monster`);
        if (handlingChoice()) runChoice(-1);
        use($item`corrupted marrow`);
    }

    ensureMeteorShowerAndCarolGhostEffect();

    if (availableAmount($item`twinkly nuggets`) > 0) {
        ensureEffect($effect`Twinkly Weapon`);
    }

    ensureEffect($effect`Carol of the Bulls`);
    ensureEffect($effect`Song of the North`);
    ensureEffect($effect`Rage of the Reindeer`);
    ensureEffect($effect`Frenzied, Bloody`);
    ensureEffect($effect`Scowl of the Auk`);
    // ensureEffect($effect`Disdain of the War Snapper`);
    // ensureEffect($effect`Tenacity of the Snapper`);
    // ensureSong($effect`Jackasses' Symphony of Destruction`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Lack of Body-Building`);
    ensureEffect($effect`Bow-Legged Swagger`);
    ensureEffect($effect`Blessing of the Bird`); // PM has 100% weapon damage

    if (!haveEffect($effect`Rictus of Yeg`)) {
        cliExecute('cargo pick 284');
        use($item`Yeg's Motel toothbrush`);
    }

    cliExecute('boombox fists');
    cliExecute('fold broken champagne bottle');
}

function doSpellTest() {
    ensureDeepDarkVisions(); // should already have this from weapon test

    if (get('_poolGames') < 3) {
        ensureEffect($effect`Mental A-cue-ity`);
    }

    // Tea party
    if (!get('_madTeaParty')) {
        ensureSewerItem(1, $item`mariachi hat`);
        ensureEffect($effect`Full Bottle in front of Me`);
    }

    useSkill(1, $skill`Spirit of Cayenne`);
    ensureEffect($effect`Elemental Saucesphere`);
    ensureEffect($effect`Astral Shell`);
    ensureEffect($effect`We're All Made of Starfish`);
    ensureEffect($effect`Simmering`);
    ensureEffect($effect`Song of Sauce`);
    ensureEffect($effect`AAA-Charged`);
    ensureEffect($effect`Carol of the Hells`);
    // ensureEffect($effect`Arched Eyebrow of the Archmage`);
    // ensureSong($effect`Jackasses' Symphony of Destruction`);

    ensureMeteorShowerAndCarolGhostEffect();

    outfit('hccs_SPELL');
    if (Math.round(numericModifier('spell damage percent')) % 50 >= 40) {
        ensureItem(1, $item`soda water`);
        ensurePotionEffect($effect`Concentration`, $item`cordial of concentration`);
    }
}

function doHotResTest() {
    if (!have($effect`Fireproof Foam Suit`)) { // eslint-disable-line
        // Get Fireproof Foam Suit
        Macro.skill($skill`Fire Extinguisher: Foam Yourself`) // eslint-disable-line
            .skill($skill`Use the Force`).setAutoAttack();
        equip($slot`weapon`, $item`industrial fire extinguisher`); // eslint-disable-line
        equip($slot`off-hand`, $item`Fourth of May Cosplay Saber`);
        adv1($location`Noob Cave`);
        if (!have($effect`Fireproof Foam Suit`)) throw `Error, not foamy enough`; // eslint-disable-line
    }

    if (!have($effect`Synthesis: Hot`)) {
        !have($item`Chubby and Plump bar`) && useSkill(1, $skill`Chubby and Plump`);

        // Tune moon sign to Blender (for advs from booze and Gno-Mart access).
        if (!get('moonTuned')) {
            // Unequip spoon.
            equip($slot`acc1`, $item`Retrospecs`);
            equip($slot`acc2`, $item`Powerful Glove`);
            equip($slot`acc3`, $item`Lil' Doctor™ bag`);

            // Actually tune the moon.
            visitUrl('inv_use.php?whichitem=10254&doit=96&whichsign=8');
        }

        ensureItem(1, $item`lime-and-chile-flavored chewing gum`);
        sweetSynthesis($item`Chubby and Plump bar`, $item`lime-and-chile-flavored chewing gum`);
    }

    ensureEffect($effect`Elemental Saucesphere`);
    ensureEffect($effect`Astral Shell`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);
    ensureEffect($effect`Feeling Peaceful`);
    ensureEffect($effect`Hot-Headed`);

    cliExecute('retrocape vampire hold');
}

function doNonCombatTest() {
    if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);

    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);
    ensureEffect($effect`The Sonata of Sneakiness`);
    ensureEffect($effect`Smooth Movements`);
    ensureEffect($effect`Invisible Avatar`);
    ensureEffect($effect`Feeling Lonely`);
    ensureEffect($effect`A Rose by Any Other Material`);
    ensureEffect($effect`Throwing Some Shade`);
    ensureEffect($effect`Silent Running`);
    ensureEffect($effect`Blessing of the Bird`); // PM has 7% NC bird

    if (get("_godLobsterFights") < 3 && have($item`God Lobster's Ring`)) {
        upkeepHpAndMp();
        useFamiliar($familiar`God Lobster`);
        equip($slot`familiar`, $item`God Lobster's Ring`);
        setChoice(1310, 2);
        GOD_LOB_MACRO.setAutoAttack();
        visitUrl("main.php?fightgodlobster=1");
        runCombat();
        visitUrl("choice.php");
        runChoice(-1);
    } else if (!have($effect`Silence of the God Lobster`)) {
        throw ('Not ready for god lob NC buff');
    }

    useFamiliar($familiar`Disgeist`);

    cliExecute('acquire porkpie-mounted popper');
}

const statDiff = (stat: Stat) => Math.floor((myBuffedstat(stat) - myBasestat(stat)) / 30)

const tests: TestObject[] = [
    {
        id: Test.HP,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - Math.floor((myMaxhp() - myBuffedstat($stat`muscle`) - 3) / 30),
        doTestPrep: doHpTest,
        maximizer: 'hp'
    }, {
        id: Test.MYS,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - statDiff($stat`mysticality`),
        doTestPrep: () => { return },
        maximizer: 'mysticality'
    }, {
        id: Test.MUS,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - statDiff($stat`muscle`),
        doTestPrep: doMusTest,
        maximizer: 'muscle'
    }, {
        id: Test.MOX,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - statDiff($stat`moxie`),
        doTestPrep: doMoxTest,
        maximizer: 'moxie'
    }, {
        id: Test.ITEM,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - Math.floor(numericModifier('item drop') / 30 + 0.001) -
            Math.floor(numericModifier('booze drop') / 15 + 0.001),
        doTestPrep: doItemTest,
        maximizer: 'item, 2 booze drop, -equip broken champagne bottle, -equip surprisingly capacious handbag'
    }, {
        id: Test.HOT_RES,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - numericModifier('hot resistance'),
        doTestPrep: doHotResTest,
        maximizer: 'hot res, 0.01 familiar weight'
    }, {
        id: Test.FAMILIAR,
        spreadsheetTurns: 37,
        getPredictedTurns: () => 60 - Math.floor((familiarWeight(myFamiliar()) + weightAdjustment()) / 5),
        doTestPrep: doFamiliarTest,
        maximizer: 'familiar weight'
    }, {
        id: Test.WEAPON,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 - Math.floor(numericModifier('weapon damage') / 25 + 0.001) -
            Math.floor(numericModifier('weapon damage percent') / 25 + 0.001),
        doTestPrep: doWeaponTest,
        maximizer: 'weapon damage, weapon damage percent'
    }, {
        id: Test.SPELL,
        spreadsheetTurns: 33,
        getPredictedTurns: () => 60 - Math.floor(numericModifier('spell damage') / 50 + 0.001) -
            Math.floor(numericModifier('spell damage percent') / 50 + 0.001),
        doTestPrep: doSpellTest,
        maximizer: 'spell damage, spell damage percent'
    }, {
        id: Test.NONCOMBAT,
        spreadsheetTurns: 1,
        getPredictedTurns: () => 60 + (20 + numericModifier('combat rate')) * 3,
        doTestPrep: doNonCombatTest,
        maximizer: '-combat, 0.01 familiar weight'
    }, {
        id: Test.COIL_WIRE,
        spreadsheetTurns: 60,
        getPredictedTurns: () => 60,
        doTestPrep: () => { return },
        maximizer: ''
    }];

const printTime = () => {
    const totalSeconds = (gametimeToInt() - getPropertyInt('bb_ScriptStartCS')) / 1000;
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    print(`Total seconds for sanity check: ${totalSeconds}`);
    print(`That only took ${min}:${sec.toFixed(2)} and ${myTurncount()} turns!`, 'green');
    print(`Organ use: ${myFullness()}/${myInebriety()}/${mySpleenUse()}`, 'green');
    for (let i = 1; i <= 10; i++) {
        const spreadsheetTurns = tests.find((test) => test.id === i) ?.spreadsheetTurns || 60;
        print(
            `Test ${Test[i].padEnd(9)} estimated: ${get(`_hccsTestExpected${i}`).toString().padStart(2)} actual: ${get(`_hccsTestActual${i}`).toString().padStart(2)} spreadsheet: ${spreadsheetTurns.toString().padStart(2)}`,
            'blue'
        );
    }
}

const endRunAndStartAftercore = () => {
    clickTestButton(Test.DONATE);
    set('hpAutoRecovery', .8);

    cliExecute('mood default');
    cliExecute('ccs default');
    cliExecute('boombox food');
    cliExecute('refresh all');

    cliExecute('hagnk all');
    cliExecute('acquire bitchin meatcar');
    buy($item`clockwork maid`, 1, 3500);
    use($item`clockwork maid`);
    visitUrl('peevpee.php?action=smashstone&confirm=on');

    // Create a key lime pie
    const keyIndex = Math.floor(Math.random() * 3) + 1;
    setChoice(1414, keyIndex);
    useSkill($skill`Lock Picking`);
    create($items`Boris's key lime pie, Jarlsberg's key lime pie, Sneaky Pete's key lime pie`[keyIndex - 1]);

    use($item`warbear induction oven`); // for cooking spooky pockets

    cliExecute('bb_login');

    if (get('_questPartyFairQuest') === 'booze' || get('_questPartyFairQuest') === 'food') {
        print('Got a quest from Gerald/ine!', 'blue');
    }
}

const parseInput = (input: string) => {
    print('Parsing options');
    if (input) {
        for (const option of input.split(' ')) {
            if (option.match(/outfit/i)) {
                CONTEXT.updateOutfits = true;
                print('Updating hccs outfits', 'blue');
            }
        }
    }
    print('Done parsing options');
}

export function main(input: string): void {
    setAutoAttack(0);

    parseInput(input);

    setup();
    getPizzaIngredients();

    runTest(Test.COIL_WIRE);

    useStatGains();
    buffBeforeGoblins();
    doFreeFights();

    if (availableAmount($item`astral six-pack`) === 1) {
        tryUse(1, $item`astral six-pack`);
        useSkill(2, $skill`The Ode to Booze`);
        drink(6, $item`astral pilsner`);
    }

    runTest(Test.MYS);
    runTest(Test.HP);
    runTest(Test.MUS);
    runTest(Test.MOX);

    useFamiliar($familiar`Exotic Parrot`);
    equip($slot`familiar`, $item`cracker`);

    runTest(Test.ITEM);
    runTest(Test.HOT_RES);
    runTest(Test.FAMILIAR);
    runTest(Test.WEAPON);
    runTest(Test.SPELL);
    runTest(Test.NONCOMBAT);

    printTime();
    endRunAndStartAftercore();
}
