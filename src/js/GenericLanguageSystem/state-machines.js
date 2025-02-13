
class EvaluationRule {
    constructor(rule, value) {
        this.rule = rule;
    }
}



class StateMachineManager{
    constructor(states) {
        this.states = states || [];
        this.transitions = [];
        this.current = null;
    }
    
    addState(State) {}
}

class Transition{}

class State{}

class StateMachine {
    constructor() {}
}