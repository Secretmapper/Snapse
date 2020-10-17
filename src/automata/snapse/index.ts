import produce from 'immer'

type NeuronID = string
type NeuronRule = string
export type NeuronState = {
  spikes: number
  delay: number
  bitstring?: string
  rule?: NeuronRule
  justResolvedRule?: NeuronRule
}

type BaseNeuron = {
  id: NeuronID
  spikes: number
  state?: NeuronState
  position: { x: number; y: number }
}

type NormalNeuron = BaseNeuron & {
  rules: NeuronRule[]
  out: NeuronID[]
  isOutput: false
}

type OutputNeuron = BaseNeuron & {
  isOutput: true
}

type Neuron = NormalNeuron | OutputNeuron
export type NeuronsMap = {
  [k: string]: Neuron
}
export type NeuronsStatesMap = {
  [k: string]: NeuronState
}

export const neurons: NeuronsMap = {
  q1: {
    id: 'q1',
    spikes: 2,
    rules: ['aa/aa->a;1'],
    out: ['q2'],
    position: { x: 300, y: 250 },
    isOutput: false
  },
  q2: {
    id: 'q2',
    spikes: 2,
    isOutput: true,
    position: { x: 600, y: 450 }
  },
  q3: {
    id: 'q3',
    spikes: 1,
    rules: ['a/a->a;2'],
    out: ['q1', 'q4'],
    position: { x: 100, y: 100 },
    isOutput: false
  },
  q4: {
    id: 'q4',
    spikes: 1,
    rules: ['a/a->a;4'],
    out: ['q1', 'q3'],
    position: { x: 100, y: 350 },
    isOutput: false
  }
}

// initialize state
export function initialize(neurons: NeuronsMap) {
  const states: NeuronsStatesMap = {}
  for (const k in neurons) {
    const neuron = neurons[k]
    states[k] = initializeState(neuron)
  }
  return states
}

export function initializeState(neuron: Neuron) {
  return {
    spikes: neuron.spikes,
    delay: 0
  }
}

type RuleMap = [number, number, number, number]
export function parseRule(rule: NeuronRule): RuleMap | false {
  const re = /(a+)\/(a+)->(a+);([0-9]+)/
  const res = re.exec(rule)
  if (res) {
    const [, requires, consumes, produces, delayStr] = res
    const delay = parseInt(delayStr, 10)
    return [requires.length, consumes.length, produces.length, delay]
  }

  return false
}
export function areRulesValid(rules: NeuronRule[]) {
  return rules.every(parseRule)
}

export function step(neurons: NeuronsMap, prevStates: NeuronsStatesMap) {
  // let's us know if we're actually stepping
  // through or the system has finished
  let hasTriggered = false
  const newStates = produce(prevStates, states => {
    const spikeAdds: { [key: string]: number } = {}

    for (const k in neurons) {
      const neuron = neurons[k]
      states[k] = states[k] || initializeState(neuron)

      const state = states[k]
      delete state.justResolvedRule

      if (!neuron.isOutput) {
        if (areRulesValid(neuron.rules)) {
          if (state.delay > 0) {
            hasTriggered = true
            state.delay--

            if (state.delay === 0) {
              // resolve neuron
              if (state.rule) {
                const [, consumes, produces] = parseRule(state.rule) as RuleMap

                state.spikes -= consumes
                state.justResolvedRule = state.rule
                delete state.rule

                const neuronOutKeys = (neurons[k] as NormalNeuron).out
                for (let k of neuronOutKeys) {
                  spikeAdds[k] =
                    k in spikeAdds ? spikeAdds[k] + produces : produces
                }
              }
            }
          } else if (state.delay === 0) {
            if (neuron.out && neuron.out.length > 0) {
              const rule = neuron.rules[0]
              const [requires, , , delay] = parseRule(rule) as RuleMap

              if (state.spikes === requires) {
                hasTriggered = true
                state.rule = rule
                state.delay = delay
              }
            }
          }
        }
      } else {
        if (!(k in spikeAdds)) {
          spikeAdds[k] = 0
        }
      }
    }

    for (const k in spikeAdds) {
      if (!states[k].rule) {
        states[k].spikes += spikeAdds[k]
      }
      if (k in neurons && neurons[k].isOutput) {
        states[k].bitstring =
          (states[k].bitstring || '') + (spikeAdds[k] || '0')
      }
    }
  })

  return hasTriggered ? newStates : prevStates
}

export function stepBack(neurons: NeuronsMap, nextStates: NeuronsStatesMap) {
  // TODO: This produces wrong output if the resolved rules are missing
  return produce(nextStates, states => {
    const spikeAdds: { [key: string]: number } = {}

    for (const k in neurons) {
      const neuron = neurons[k]
      const state = states[k]

      if (!neuron.isOutput) {
        if (state.delay === 0) {
          // resolved neuron
          if (state.justResolvedRule) {
            const [, consumes, produces] = parseRule(
              state.justResolvedRule
            ) as RuleMap
            state.spikes += consumes
            state.rule = state.justResolvedRule
            state.delay++
            delete state.justResolvedRule

            const neuronOutKeys = (neurons[k] as NormalNeuron).out
            for (let k of neuronOutKeys) {
              spikeAdds[k] = k in spikeAdds ? spikeAdds[k] + produces : produces
            }
          }
        } else if (state.rule) {
          // running a rule
          const [, , , delay] = parseRule(state.rule) as RuleMap
          // it just started running
          if (state.delay === delay) {
            delete state.rule
            state.delay = 0
          } else {
            state.delay++
          }
        }
      } else {
        state.bitstring = state.bitstring?.slice(0, -1)
        if (state.bitstring?.length === 0) {
          delete state.bitstring
        }
      }
    }

    for (const k in spikeAdds) {
      states[k].spikes -= spikeAdds[k]
    }
  })
}
