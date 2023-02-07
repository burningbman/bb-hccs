import { PRE_QUEST, POST_QUEST } from "./globaltasks";
import { Engine, getTasks, Outfit, OutfitSpec, Quest, Task } from "grimoire-kolmafia";
import {
    cliExecute,
    print,
    readCcs,
    setAutoAttack,
    writeCcs,
} from "kolmafia";
import { $effect, CommunityService, get, PropertiesManager, uneffect } from "libram";
import { printModtrace } from "./lib";

type Service = {
    type: "SERVICE";
    test: CommunityService;
    maxTurns: number;
    outfit: () => OutfitSpec;
};
type Misc = {
    type: "MISC";
    name: string;
};
export type CSQuest = Quest<Task> & { turnsSpent?: number | (() => number) } & (Service | Misc) & {
    modifiers: string[] | undefined,
    outfit(): OutfitSpec
};

export class CSEngine extends Engine<never, Task> {
    private static propertyManager = new PropertiesManager();
    propertyManager = CSEngine.propertyManager;
    name: string;
    csOptions: Service | Misc;
    turnsSpent?: number | (() => number);

    constructor(quest: CSQuest) {
        super(getTasks([PRE_QUEST, quest, POST_QUEST]));
        this.csOptions = quest;
        this.turnsSpent = quest.turnsSpent;
        this.name =
            this.csOptions.type === "MISC" ? this.csOptions.name : this.csOptions.test.statName;
    }

    destruct(): void {
        setAutoAttack(0);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    initPropertiesManager(): void { }
    private static initiate(): void {
        CSEngine.propertyManager.set({
            customCombatScript: "grimoire_macro",
            battleAction: "custom combat script",
            dontStopForCounters: true,
            hpAutoRecovery: -0.05,
            mpAutoRecovery: -0.05,
            logPreferenceChange: true,
            logPreferenceChangeFilter: [
                ...new Set([
                    ...get("logPreferenceChangeFilter").split(","),
                    "libram_savedMacro",
                    "maximizerMRUList",
                    "testudinalTeachings",
                    "_lastCombatStarted",
                ]),
            ]
                .sort()
                .filter((a) => a)
                .join(","),
            autoSatisfyWithNPCs: true,
            autoSatisfyWithStorage: false,
            libramSkillsSoftcore: "none",
        });

        CSEngine.propertyManager.setChoices({
            1467: 3,
            1468: 2,
            1469: 3,
            1470: 2,
            1471: 3,
            1472: 1,
            1473: 1,
            1474: 1,
            1475: 1,
        });

        if (!readCcs("grimoire_macro")) {
            writeCcs("[ default ]\nabort", "grimoire_macro");
        }
    }

    private get turns(): number {
        if (!this.turnsSpent) return 0;
        if (typeof this.turnsSpent === "function") return this.turnsSpent();
        return this.turnsSpent;
    }

    private runTest(): void {
        const loggingFunction = (action: () => number | void) =>
            this.csOptions.type === "MISC"
                ? CommunityService.logTask(this.name, action)
                : this.csOptions.test.run(action, this.csOptions.maxTurns);
        try {
            const result = loggingFunction(() => {
                this.run();
                if (this.csOptions.type === "SERVICE") {
                    Outfit.from(
                        this.csOptions.outfit(),
                        new Error(`Failed to equip outfit for ${this.name}`)
                    ).dress();
                }

                return this.turns;
            });
            const warning =
                this.csOptions.type === "MISC"
                    ? `Failed to execute ${this.name}!`
                    : `Failed to cap ${this.name}!`;

            if (result === "failed") throw new Error(warning);

            if (result === "already completed")
                throw new Error(
                    `Libram thinks we already completed ${this.name} but we beg to differ`
                );
        } finally {
            this.destruct();
        }
    }

    static runTests(...quests: CSQuest[]): void {
        // if (myPath() !== $path`Community Service`) abort();
        // visitUrl("council.php");
        CSEngine.initiate();

        try {
            for (const quest of quests) {
                const { type } = quest;
                if (type === "MISC" || !quest.test.isDone()) {
                    const engine = new CSEngine(quest);
                    engine.runTest();
                    quest.modifiers && printModtrace(quest.modifiers);
                }
            }

            CommunityService.printLog('green');
            CommunityService.donate();
            cliExecute("refresh all");
            uneffect($effect`Feeling Lost`);
            cliExecute(get("kingLiberatedScript"));

            if (get("_cloudTalkSmoker")) {
                print(
                    `${get("_cloudTalkSmoker").slice(10)} has a message for you: ${get(
                        "_cloudTalkMessage"
                    )}`
                );
            }

            if (["food", "booze"].includes(get("_questPartyFairQuest"))) {
                print("Talk to Gerald/ine!");
            }
        } finally {
            CSEngine.propertyManager.resetAll();
        }
    }
}