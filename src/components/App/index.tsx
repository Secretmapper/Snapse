import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscapejs from 'cytoscape'
import styled, { css, keyframes } from 'styled-components'
import Layout from '../Layout'
import Snapse from '../Snapse'
import {
  initialize,
  initializeState,
  neurons as initialNeurons,
  NeuronState,
  NeuronsMap,
  NeuronsStatesMap,
  step,
  areRulesValid
} from '../../automata/snapse'
import { createEdge, createNeuron, createOutput } from '../Snapse/helpers'
import classList from '../../utils/classList'
import Button from '../Button'
import Typography from '../Typography'

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

function usePrevious<T>(value: T) {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref
}

function App() {
  const [neurons, setNeurons] = useState(initialNeurons)
  const [isPlaying, setIsPlaying] = useState(false)
  const [neuronsState, setNeuronsState] = useState(() => initialize(neurons))
  const previousNeuronsStateRef = usePrevious(neuronsState)

  const onTogglePlay = () => {
    setIsPlaying(p => !p)
  }
  const onBack = (n: NeuronsMap = neurons) => {
    // setNeuronsState(neuronsState => stepBack(n, neuronsState))
  }
  const onForward = (n: NeuronsMap = neurons) => {
    setNeuronsState(neuronsState => step(n, neuronsState))
  }
  const elements = useMemo(
    () => convert(neurons, neuronsState, previousNeuronsStateRef.current),
    [neurons, neuronsState, previousNeuronsStateRef]
  )

  const [pBar, setPBar] = useState(0)
  const neuronsRef = useRef(neurons)
  neuronsRef.current = neurons
  const onIntervalStepRef = useRef(onForward)
  onIntervalStepRef.current = () => {
    onForward(neurons)
    setPBar(p => p + 1)
  }
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying) {
      interval = setInterval(() => {
        onIntervalStepRef.current()
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isPlaying, onIntervalStepRef])

  const onSave = () => {
    window.localStorage.setItem('neurons', JSON.stringify(neurons))
  }
  const onLoad = () => {
    setNeurons(JSON.parse(window.localStorage.getItem('neurons') || ''))
  }
  const onReset = () => {
    setNeurons(initialNeurons)
  }

  return (
    <Layout
      main={<Snapse elements={elements} setNeurons={setNeurons} />}
      side={
        <Container>
          <Title>Snapse</Title>
          <Subtitle>
            Modern Spiking Neural P systems Maker and Visualizer
          </Subtitle>
          <StepBackButton onClick={() => onBack()}>Back</StepBackButton>
          <ProgressBar key={pBar} isPlaying={isPlaying} />
          <PlayButton onClick={onTogglePlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </PlayButton>
          <StepForwardButton onClick={() => onForward()}>
            Forward
          </StepForwardButton>
          <br />
          <br />
          <br />
          <br />
          <Button onClick={onSave}>Save</Button>
          <Button onClick={onLoad}>Load</Button>
          <Button onClick={onReset}>Reset</Button>
        </Container>
      }
    />
  )
}

const shortening = keyframes`
  from {
    transform: scaleX(100%);
  }

  to {
    transform: scaleX(0%);
  }
`
const ProgressBar = styled.div<{ isPlaying: boolean }>`
  ${props =>
    props.isPlaying &&
    css`
      animation: ${shortening} 1s linear;
    `}
  background-color: red;
  height: 4px;
  transform-origin: left center;
  width: 100%;
`

const Container = styled.div`
  border-style: solid;
  border-width: 0;
  border-right-width: 1px;
  border-color: #e1e4e8;
  padding: 20px;
  height: 100%;
`
const Title = styled(Typography).attrs(() => ({ as: 'h1' }))`
  margin: 0;
  text-align: center;
`
const Subtitle = styled(Typography).attrs(() => ({ as: 'h3' }))`
  font-size: 13px;
  text-align: center;
  margin-top: 4px;
  margin-bottom: 8px;
`
const StepBackButton = styled(Button)``
const PlayButton = styled(Button)``
const StepForwardButton = styled(Button)``

export default App
