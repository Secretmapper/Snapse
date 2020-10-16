import produce from 'immer'

type NeuronID = string
type NeuronRule = string
type NeuronState = {
  spikes: number
  delay: number
  rule?: NeuronRule
  justResolvedRule?: boolean
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
  isOutput?: false
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
    position: { x: 250, y: 250 }
  },
  q1: {
    id: 'q1',
    spikes: 2,
    rules: ['aa/aa->a;2'],
    out: ['q2'],
    position: { x: 400, y: 250 }
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

    states[k] = {
      justResolvedRule: false,
      spikes: neuron.spikes,
      delay: 0
    }
  }
  return states
}

function parseRule(rule: NeuronRule) {
  const [str, delayStr] = rule.split(';') // ['E/a_c->a_p', 'd']
  const [input, produces] = str.split('->') // ['E/a_c', 'a_p']
  const [requires, consumes] = input.split('/') // ['E', 'a_c']

  const delay = parseInt(delayStr, 10)

  return [requires.length, produces.length, consumes.length, delay]
}

export function step(neurons: NeuronsMap, prevStates: NeuronsStatesMap) {
  return produce(prevStates, states => {
    const spikeAdds: { [key: string]: number } = {}

    for (const k in neurons) {
      const neuron = neurons[k]
      const state = states[k]
      states[k].justResolvedRule = false

      if (state.delay > 0) {
        state.delay--

        if (state.delay === 0) {
          // resolve neuron
          if (state.rule) {
            const [, produces, consumes] = parseRule(state.rule)

            states[k].spikes -= consumes
            delete states[k].rule
            states[k].justResolvedRule = true

            const neuronOutKeys = (neurons[k] as NormalNeuron).out
            for (let k of neuronOutKeys) {
              spikeAdds[k] = k in spikeAdds ? spikeAdds[k] + produces : produces
            }
          }
        }
      } else if (state.delay === 0) {
        if (!neuron.isOutput) {
          if (neuron.out && neuron.out.length > 0) {
            const rule = neuron.rules[0]
            const [requires, , , delay] = parseRule(rule)

            if (state.spikes >= requires) {
              state.rule = rule
              state.delay = delay
            }
          }
        }
      }
    }

    for (const k in spikeAdds) {
      states[k].spikes += spikeAdds[k]
    }
  })
}
