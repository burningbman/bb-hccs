import { CombatStrategy } from "grimoire-kolmafia";
import { myPrimestat } from "kolmafia";
import { $skill, $skills, $stat, have, Macro as LibramMacro } from "libram";

export class CSStrategy extends CombatStrategy {
    constructor(macro: () => Macro = () => Macro.kill()) {
        super();
        this.macro(macro).autoattack(macro);
    }
}
export class Macro extends LibramMacro {
    delevel(): Macro {
        return this.trySkill(...$skills`Curse of Weaksauce, Micrometeorite, Entangling Noodles`);
    }
    static delevel(): Macro {
        return new Macro().delevel();
    }

    itemSkills(): Macro {
        return this.trySkill(...$skills`Barrage of Tears, Spittoon Monsoon, Beach Combo`);
    }

    static itemSkills(): Macro {
        return new Macro().delevel();
    }

    easyFight(): Macro {
        return this.trySkill(...$skills`Extract, Sing Along`);
    }
    static easyFight(): Macro {
        return new Macro().easyFight();
    }

    kill(): Macro {
        return this.externalIf(
            myPrimestat() === $stat`Mysticality`,
            this.trySkillRepeat($skill`Saucegeyser`),
            this.attack().repeat()
        );
    }
    static kill(): Macro {
        return new Macro().kill();
    }

    default(bowlSideways?: boolean): Macro {
        return this.delevel()
            .itemSkills()
            .externalIf(Boolean(bowlSideways), Macro.trySkill($skill`Bowl Sideways`))
            .easyFight()
            .kill();
    }
    static default(bowlSideways?: boolean): Macro {
        return new Macro().default(bowlSideways);
    }

    toString(): string {
        return `${LibramMacro.ifHolidayWanderer(
            LibramMacro.skill($skill`Feel Hatred`)
        ).toString()};${super.toString()}`;
    }
}