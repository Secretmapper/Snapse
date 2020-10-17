import React, { useEffect, useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import Layout from '../Layout'
import Snapse from '../Snapse'
import {
  initialize,
  neurons as initialNeurons,
  NeuronsMap,
  step
} from '../../automata/snapse'
import Button from '../Button'
import Typography from '../Typography'

function App() {
  const [neurons, setNeurons] = useState(initialNeurons)
  const [isPlaying, setIsPlaying] = useState(false)
  const [neuronsState, setNeuronsState] = useState(() => initialize(neurons))

  const onTogglePlay = () => {
    setIsPlaying(p => !p)
  }
  const onBack = (n: NeuronsMap = neurons) => {
    // setNeuronsState(neuronsState => stepBack(n, neuronsState))
  }
  const onForward = (n: NeuronsMap = neurons) => {
    setNeuronsState(neuronsState => step(n, neuronsState))
  }

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
      main={
        <Snapse
          neurons={neurons}
          neuronsState={neuronsState}
          setNeurons={setNeurons}
        />
      }
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
