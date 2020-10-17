import cytoscapejs from 'cytoscape'
import {
  initializeState,
  NeuronState,
  NeuronsMap,
  NeuronsStatesMap,
  areRulesValid
} from '../../automata/snapse'
import { createEdge, createNeuron, createOutput } from './helpers'
import classList from '../../utils/classList'

function convert(
  neurons: NeuronsMap,
  neuronsState: NeuronsStatesMap,
  prevStates: NeuronsStatesMap = {}
): cytoscapejs.ElementDefinition[] {
  let elements: cytoscapejs.ElementDefinition[] = []

  for (let k in neurons) {
    const neuron = neurons[k]
    const state: NeuronState = neuronsState[k] || initializeState(neuron)
    const prevState = prevStates[neuron.id]

    if (!neuron.isOutput) {
      const validRules = areRulesValid(neuron.rules)
      const neuronCard = createNeuron(
        neuron.id,
        neuron.position.x,
        neuron.position.y,
        neuron.id,
        neuron.rules.join('\n'),
        state.spikes,
        state.delay
      )
      if (!validRules) {
        neuronCard[1].classes = classList.add(
          neuronCard[1].classes,
          'snapse-node__rules--invalid'
        )
      }
      if (prevState) {
        if (prevState.spikes < state.spikes) {
          neuronCard[2].classes = classList.add(
            neuronCard[2].classes,
            'node--value-increase'
          )
        } else if (prevState.spikes > state.spikes) {
          neuronCard[2].classes = classList.add(
            neuronCard[2].classes,
            'node--value-decrease'
          )
        }

        if (prevState.delay < state.delay) {
          neuronCard[3].classes = classList.add(
            neuronCard[3].classes,
            'node--value-increase'
          )
        } else if (prevState.delay > state.delay) {
          neuronCard[3].classes = classList.add(
            neuronCard[3].classes,
            'node--value-decrease'
          )
        }
      }
      if (state.rule) {
        neuronCard[1].classes = classList.add(
          neuronCard[1].classes,
          'node--locked'
        )
      }
      if (state.justResolvedRule) {
        neuronCard[1].classes = classList.add(
          neuronCard[1].classes,
          'node--triggering'
        )
      }
      elements = elements.concat(neuronCard)
      if (neuron.out) {
        for (let out of neuron.out) {
          const edges = createEdge(neuron.id, out)
          if (state.justResolvedRule) {
            edges[0].classes = classList.add(
              edges[0].classes,
              'edge--triggering'
            )
          }
          elements = elements.concat(edges)
        }
      }
    } else {
      elements = elements.concat(
        createOutput(
          neuron.id,
          neuron.position.x,
          neuron.position.y,
          neuron.id,
          state.bitstring || '',
          state.spikes
        )
      )
    }
  }

  return elements
}

export default convert
