export abstract class IStateMachine<D> {
    abstract advance(d: D): boolean;
    abstract check(): boolean;
    and(...others: IStateMachine<D>[]): IStateMachine<D> {
        return new StateMachineCombiner([this, ...others], (x) => x.every(v=>v));
    }
    or(...others: IStateMachine<D>[]): IStateMachine<D> {
        return new StateMachineCombiner([this, ...others], (x) => x.some(v=>v));
    }
    xor(...others: IStateMachine<D>[]): IStateMachine<D> {
        return new StateMachineCombiner([this, ...others], (x) => {
            let one = false;
            for (const v of x) {
                if (v) {
                    if (one) {
                        return false;
                    }
                    one = true;
                }
            }
            return one;
        });
    }
    not(): IStateMachine<D> {
        return new StateMachineInvert(this);
    }
    run(iterable: Iterable<D>): boolean {
        for (const d of iterable) {
            if (!this.advance(d)) return false;
        }
        return this.check();
    }
}

type ExitingStateMachineTransitions<D, Labels extends string | number | symbol> = Record<Labels, (data: D) => Labels | false>;
interface ExitingStateMachineDefinition<D, Labels extends string | number | symbol> {
    start: Labels,
    transitions: ExitingStateMachineTransitions<D, Labels>,
    acceptance: Record<Labels, boolean>
}
export class ExitingStateMachine<D, Labels extends string | number | symbol> extends IStateMachine<D> {
    private state: Labels;
    private transitions: ExitingStateMachineTransitions<D, Labels>;
    private acceptance: Record<Labels, boolean>;
    private rejected: boolean = false;
    constructor(definition: ExitingStateMachineDefinition<D, Labels>) {
        super();
        this.state = definition.start;
        this.transitions = definition.transitions;
        this.acceptance = definition.acceptance;
    }
    advance(d: D) {
        if (this.rejected) {
            return false;
        }
        let state_update = this.transitions[this.state](d);
        if (typeof state_update === 'boolean' && !state_update) {
            this.rejected = true;
            return false;
        }
        this.state = state_update;
        return true;
    }
    check() {
        if (this.rejected) return false;
        return this.acceptance[this.state];
    }

}

type StateMachineTransitions<D, Labels extends string | number | symbol> = Record<Labels, (data: D) => Labels>;
interface StateMachineDefinition<D, Labels extends string | number | symbol> {
    start: Labels,
    transitions: StateMachineTransitions<D, Labels>,
    acceptance: Record<Labels, boolean>
}
export class StateMachine<D, Labels extends string | number | symbol> extends IStateMachine<D> {
    private state: Labels;
    private transitions: StateMachineTransitions<D, Labels>;
    private acceptance: Record<Labels, boolean>;
    constructor(definition: StateMachineDefinition<D, Labels>) {
        super();
        this.state = definition.start;
        this.transitions = definition.transitions;
        this.acceptance = definition.acceptance;
    }
    advance(d: D) {
        this.state = this.transitions[this.state](d);
        return true;
    }
    check() {
        return this.acceptance[this.state];
    }
}

export class StateMachineInvert<D> extends IStateMachine<D> {
    self_rejected: boolean = false;
    constructor(private self: IStateMachine<D>) {
        super();
    }
    advance(d: D) {
        this.self_rejected ||= !this.self.advance(d);
        return true;
    }
    check() {
        if (this.self_rejected) return true;
        return !this.self.check();
    }
}

export class StateMachineCombiner<D, M extends IStateMachine<D>[]> extends IStateMachine<D> {
    constructor(private state_machines: M, private combiner: (acceptance: {[I in keyof M]: boolean}) => boolean) {
        super();
    }
    advance(d: D) {
        for (const m of this.state_machines) {
            if (!m.advance(d)) return false;
        }
        return true;
    }
    check() {
        return this.combiner(this.state_machines.map(m=>m.check()) as {[I in keyof M]: boolean});
    }
}

