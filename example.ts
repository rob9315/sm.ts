import * as sm from './sm.ts';

function is_valid(s: string): boolean {
    const sm_1 = new sm.StateMachine({
        start: 'start',
        acceptance: {
            start: false,
            letter1: false,
            letter2: true,
            num: true,
            other: false,
        },
        transitions: {
            start: (c: string) => /[a-zA-Z]/.test(c) ? 'letter1' : 'other',
            letter1: c => /[a-zA-Z]/.test(c) ? 'letter2' : 'other',
            letter2: c => /[a-zA-Z]/.test(c) ? 'letter2' : (/[1-9]/.test(c) ? 'num' : 'other'),
            num: c => /[0-9]/.test(c) ? 'num' : 'other',
            other: _ => 'other',
        }
    });
    const sm_2 = new sm.ExitingStateMachine({
        start: 0,
        acceptance: [false, false, true, true, true, true, true],
        transitions: {
            0: _ => 1,
            1: _ => 2,
            2: _ => 3,
            3: _ => 4,
            4: _ => 5,
            5: _ => 6,
            6: _ => false,
        }
    });
    return sm_1.and(sm_2).run(s);
}

console.log(is_valid(""))
console.log(is_valid("as"))
console.log(is_valid("asdfhj"))
console.log(is_valid("as123"))
console.log(is_valid("as012"))
console.log(is_valid("asasdff"))
