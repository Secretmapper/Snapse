import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscapejs from 'cytoscape'
import Snapse from '../Snapse'
import styled from 'styled-components'
import {
  initialize,
  initializeState,
  neurons as initialNeurons,
  NeuronState,
  NeuronsMap,
  NeuronsStatesMap,
  step
} from '../../automata/snapse'
import { createEdge, createNeuron, createOutput } from '../Snapse/helpers'
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
      const neuronCard = createNeuron(
        neuron.id,
        neuron.position.x,
        neuron.position.y,
        neuron.id,
        neuron.rules.join('\n'),
        state.spikes,
        state.delay
      )
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
          state.delay
        )
      )
    }
  }

  return elements
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

function App() {
  const [neurons, setNeurons] = useState(initialNeurons)
  const [neuronsState, setNeuronsState] = useState(() => initialize(neurons))
  const previousNeuronsState = usePrevious(neuronsState)

  const onForward = () => {
    setNeuronsState(step(neurons, neuronsState))
  }
  const elements = useMemo(
    () => convert(neurons, neuronsState, previousNeuronsState),
    [neurons, neuronsState, previousNeuronsState]
  )

  return (
    <Container>
      <Snapse elements={elements} setNeurons={setNeurons} />
      <Controls>
        <StepBackButton>Back</StepBackButton>
        <PlayButton>Play</PlayButton>
        <StepForwardButton onClick={onForward}>Forward</StepForwardButton>
      </Controls>
    </Container>
  )
}

const Container = styled.div`
  height: 100%;
  width: 100%;
  flex: 1;
`
const Controls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`
const StepBackButton = styled.button``
const PlayButton = styled.button``
const StepForwardButton = styled.button``

export default App
