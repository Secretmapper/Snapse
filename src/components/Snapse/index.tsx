import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import cytoscapejs from 'cytoscape'
import Graph from '../Graph'
import styled from 'styled-components'
import { NeuronsMap, NeuronsStatesMap } from '../../automata/snapse'
import convert from './convert'

let qId = 5

type Position = {
  x: number
  y: number
}
type EditingState = {
  id?: string
  position: Position
  renderedPosition: Position
  rules: string
  spike: string
}

export type ISnapse = {
  neurons: NeuronsMap
  neuronsState: NeuronsStatesMap
  setNeurons: Dispatch<SetStateAction<NeuronsMap>>
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref
}
function Snapse(props: ISnapse) {
  const previousNeuronsStateRef = usePrevious(props.neuronsState)
  const elements = useMemo(
    () =>
      convert(
        props.neurons,
        props.neuronsState,
        previousNeuronsStateRef.current
      ),
    [props.neurons, props.neuronsState, previousNeuronsStateRef]
  )

  const [editing, setEditing] = useState<EditingState | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const onSubmitForm = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (editing) {
      const spikeValue = parseInt(editing.spike, 10)
      const spikeLabel = isNaN(spikeValue) ? 0 : spikeValue

      if (editing.id != null) {
        const id = editing.id
        props.setNeurons(neurons => ({
          ...neurons,
          [id]: {
            ...neurons[id],
            rules: editing.rules.trim().split('\n'),
            spikes: spikeLabel
          }
        }))
      } else {
        // create a new node
        const id = `q${qId++}`
        props.setNeurons(neurons => ({
          ...neurons,
          [id]: {
            id,
            spikes: spikeLabel,
            position: {
              x: editing.position.x,
              y: editing.position.y
            },
            rules: editing.rules.trim().split('\n'),
            out: [],
            isOutput: false
          }
        }))
      }
      setEditing(null)
    }
  }
  const onRulesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rules = e.target.value
    setEditing(ed => (ed ? { ...ed, rules } : null))
  }
  const onSpikeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const spike = e.target.value
    setEditing(ed => (ed ? { ...ed, spike } : null))
  }
  const onEditNode = (
    id: string,
    renderedPosition: Position,
    position: Position
  ) => {
    const neuron = props.neurons[id]
    if (!neuron.isOutput) {
      const rules = neuron.rules
      const spike = neuron.spikes

      setEditing({
        id,
        renderedPosition,
        position,
        rules: rules.join('\n'),
        spike: `${spike}`
      })
    }
  }
  const onDeleteNode = (id: string) => {
    props.setNeurons(neurons => {
      const newNeurons = { ...neurons }
      delete newNeurons[id]
      return newNeurons
    })
  }
  const onDeleteEdge = (source: string, target: string) => {
    props.setNeurons(prev => {
      const neurons = { ...prev }
      const neuron = { ...neurons[source] }
      if (neuron.isOutput === false) {
        neuron.out = neuron.out.filter(val => val !== target)
      }
      return neurons
    })
  }

  const onSurfaceClick = (renderedPosition: Position, position: Position) => {
    setEditing({
      renderedPosition,
      position,
      rules: '',
      spike: ''
    })
  }
  const onCreateOutput = (position: Position) => {
    const id = `q${qId++}`
    props.setNeurons(neurons => ({
      ...neurons,
      [id]: {
        id,
        spikes: 1,
        position,
        isOutput: true
      }
    }))
  }
  const onEdgeCreate = (src: string, dst: string) => {
    const id = src
    props.setNeurons(prev => {
      const neurons = { ...prev }
      const neuron = { ...neurons[id] }
      if (neuron.isOutput === false) {
        neuron.out = [...neuron.out, dst]
      }
      neurons[id] = neuron
      return neurons
    })
  }

  const cbs = {
    onSurfaceClick,
    onCreateOutput,
    onEditNode,
    onDeleteNode,
    onDeleteEdge
  }
  const cbsRef = useRef(cbs)
  cbsRef.current = cbs
  const cxtMenus = useMemo(
    () => [
      {
        selector: 'core',
        commands: [
          {
            content: 'Create Node',
            select: function (_: any, e: cytoscapejs.EventObject) {
              cbsRef.current.onSurfaceClick(e.renderedPosition, e.position)
            }
          },
          {
            content: 'Create Output',
            select: function (_: any, e: cytoscapejs.EventObject) {
              cbsRef.current.onCreateOutput(e.position)
            }
          }
        ]
      },
      {
        selector: 'node',
        commands: [
          {
            content: 'Edit Node',
            select: function (ele: cytoscapejs.NodeSingular) {
              cbsRef.current.onEditNode(
                ele.id(),
                ele.renderedPosition(),
                ele.position()
              )
            }
          },
          {
            content: 'Delete Node',
            select: function (ele: cytoscapejs.NodeSingular) {
              cbsRef.current.onDeleteNode(ele.id())
            }
          }
        ]
      },
      {
        selector: 'edge',
        commands: [
          {
            content: 'Delete Edge',
            select: function (ele: cytoscapejs.NodeSingular) {
              cbsRef.current.onDeleteEdge(
                ele.data('source'),
                ele.data('target')
              )
            }
          }
        ]
      }
    ],
    [cbsRef]
  )

  return (
    <Container>
      <Graph
        elements={elements}
        editing={editing}
        cxtMenus={cxtMenus}
        onEdgeCreate={(
          src: cytoscapejs.NodeSingular,
          dst: cytoscapejs.NodeSingular,
          addedEles: cytoscapejs.EdgeCollection
        ) => {
          onEdgeCreate(src.id(), dst.id())
          // let's remove the added elements
          // and let our passed props recreate it
          addedEles.remove()
        }}
      />
      {editing && (
        <InputContainer
          style={{
            left: editing?.renderedPosition.x,
            top: editing?.renderedPosition.y
          }}>
          <form onSubmit={onSubmitForm}>
            <div>
              <label>Rules</label>
            </div>
            <div>
              <RulesInput
                autoFocus
                ref={inputRef}
                value={editing?.rules}
                onChange={onRulesChange}
              />
            </div>
            <div>
              <label>Initial Spikes</label>
            </div>
            <div>
              <SpikeInput
                placeholder="0"
                type="number"
                value={editing?.spike}
                onChange={onSpikeChange}
              />
            </div>
            <div>
              <button>Save Node</button>
            </div>
          </form>
        </InputContainer>
      )}
    </Container>
  )
}

const Container = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
`

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  text-align: center;
  transform: translate3d(-50%, -50%, 0);
`

const RulesInput = styled.textarea`
  background-color: rgba(244, 244, 244, 1);
  height: 150px;
  margin: 2px;
  outline-width: thin;
  text-align: center;
  width: 100px;
`

const SpikeInput = styled.input`
  background-color: rgba(244, 244, 244, 1);
  margin: 2px;
  outline-width: thin;
  text-align: center;
`

export default Snapse
