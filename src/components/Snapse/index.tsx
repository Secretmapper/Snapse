import React, {
  Dispatch,
  SetStateAction,
  useMemo,
  useRef,
  useState
} from 'react'
import cytoscapejs from 'cytoscape'
import Graph from '../Graph'
import styled from 'styled-components'
import { NeuronsMap } from '../../automata/snapse'

let qId = 3

type EditingState = {
  id?: string
  position: {
    x: number
    y: number
  }
  renderedPosition: {
    x: number
    y: number
  }
  rules: string
  spike: string
}

export type ISnapse = {
  elements: cytoscapejs.ElementDefinition[]
  setNeurons: Dispatch<SetStateAction<NeuronsMap>>
}

function Snapse(props: ISnapse) {
  const elements = props.elements
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
            rules: editing.rules.split('\n'),
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
            rules: editing.rules.split('\n'),
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
    e: cytoscapejs.NodeSingular,
    evt: cytoscapejs.EventObject
  ) => {
    const id = e.id()
    const rules = elements.find(el => el.data.id === `${id}-rules`)?.data.label
    const spike = elements.find(el => el.data.id === `${id}-spike`)?.data.label

    setEditing({
      id,
      renderedPosition: e.renderedPosition(),
      position: e.position(),
      rules,
      spike
    })
  }
  const onDeleteNode = (id: string) => {
    props.setNeurons(neurons => {
      const newNeurons = { ...neurons }
      delete newNeurons[id]
      return newNeurons
    })
  }
  const onDeleteEdge = (ele: cytoscapejs.NodeSingular) => {
    const source = ele.data('source')
    const target = ele.data('target')
    props.setNeurons(prev => {
      const neurons = { ...prev }
      const neuron = { ...neurons[source] }
      if (neuron.isOutput === false) {
        neuron.out = neuron.out.filter(val => val !== target)
      }
      return neurons
    })
    // setElements(elements => elements.filter(el => el.data.id !== id))
  }

  const onSurfaceClick = (evt: cytoscapejs.EventObject) => {
    setEditing({
      renderedPosition: evt.renderedPosition,
      position: evt.position,
      rules: '',
      spike: ''
    })
  }
  const onCreateOutput = (evt: cytoscapejs.EventObject) => {
    const id = `q${qId++}`
    props.setNeurons(neurons => ({
      ...neurons,
      [id]: {
        id,
        spikes: 1,
        position: {
          x: evt.position.x,
          y: evt.position.y
        },
        isOutput: true
      }
    }))
  }
  const onEdgeCreate = (
    src: cytoscapejs.NodeSingular,
    dst: cytoscapejs.NodeSingular,
    addedEles: cytoscapejs.EdgeCollection
  ) => {
    const id = src.id()
    props.setNeurons(prev => {
      const neurons = { ...prev }
      const neuron = { ...neurons[id] }
      if (neuron.isOutput === false) {
        neuron.out = [...neuron.out, dst.id()]
      }
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
              cbsRef.current.onSurfaceClick(e)
            }
          },
          {
            content: 'Create Output',
            select: function (_: any, e: cytoscapejs.EventObject) {
              cbsRef.current.onCreateOutput(e)
            }
          }
        ]
      },
      {
        selector: 'node',
        commands: [
          {
            content: 'Edit Node',
            select: function (
              ele: cytoscapejs.NodeSingular,
              e: cytoscapejs.EventObject
            ) {
              cbsRef.current.onEditNode(ele, e)
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
              cbsRef.current.onDeleteEdge(ele)
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
        elements={props.elements}
        editing={editing}
        cxtMenus={cxtMenus}
        onEdgeCreate={onEdgeCreate}
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
