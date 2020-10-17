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
  q0: {
    id: 'q0',
    spikes: 2,
    rules: ['a/a->a;1'],
    out: ['q1'],
    position: { x: 250, y: 250 },
    isOutput: false
  },
  q1: {
    id: 'q1',
    spikes: 2,
    rules: ['aa/aa->a;2'],
    out: ['q2'],
    position: { x: 400, y: 250 },
    isOutput: false
  },
  q2: {
    id: 'q2',
    spikes: 2,
    isOutput: true,
    position: { x: 600, y: 250 }
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

function parseRule(rule: NeuronRule) {
  const [str, delayStr] = rule.split(';') // ['E/a_c->a_p', 'd']
  const [input, produces] = str.split('->') // ['E/a_c', 'a_p']
  const [requires, consumes] = input.split('/') // ['E', 'a_c']

  const delay = parseInt(delayStr, 10)

  return [requires.length, produces.length, consumes.length, delay]
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
        if (state.delay > 0) {
          hasTriggered = true
          state.delay--

          if (state.delay === 0) {
            // resolve neuron
            if (state.rule) {
              const [, produces, consumes] = parseRule(state.rule)

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
            const [requires, , , delay] = parseRule(rule)

            if (state.spikes === requires) {
              hasTriggered = true
              state.rule = rule
              state.delay = delay
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
      states[k].spikes += spikeAdds[k]
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
            const [, produces, consumes] = parseRule(state.justResolvedRule)
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
          const [, , , delay] = parseRule(state.rule)
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
