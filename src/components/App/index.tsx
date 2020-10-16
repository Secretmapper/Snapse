import React, { useMemo, useRef, useState } from 'react'
import cytoscapejs from 'cytoscape'
import Graph from '../Graph'
import styled from 'styled-components'

const card = (
  id: string,
  x: number,
  y: number,
  label: string,
  rules: string,
  spike: number,
  time: number
): cytoscapejs.ElementDefinition[] => [
  {
    data: { rootId: id, id: `${id}`, label },
    classes: 'snapse-node',
    position: { x: 0, y: 0 }
  },
  {
    data: { rootId: id, id: `${id}-rules`, parent: id, label: rules },
    classes: 'snapse-node__rules',
    position: { x, y: y }
  },
  {
    data: { rootId: id, id: `${id}-spike`, parent: id, label: spike },
    classes: 'snapse-node__spike',
    position: { x, y: y + 90 }
  },
  {
    data: { rootId: id, id: `${id}-time`, parent: id, label: time },
    classes: 'snapse-node__time',
    position: { x, y: y + 110 }
  }
]

const createOutput = (
  id: string,
  x: number,
  y: number,
  label: string,
  spike: number
): cytoscapejs.ElementDefinition[] => [
  {
    data: { rootId: id, id: `${id}`, label },
    classes: 'snapse-output',
    position: { x: 0, y: 0 }
  },
  {
    data: { rootId: id, id: `${id}-output`, parent: id, label: '' },
    classes: 'snapse-node__output',
    position: { x, y: y }
  },
  {
    data: { rootId: id, id: `${id}-spike`, parent: id, label: spike },
    classes: 'snapse-node__spike',
    position: { x, y: y + 50 }
  }
]

let qId = 2

const oneLabel = `
a/a->a;1
aa/a->a;1
`
const initialState: cytoscapejs.ElementDefinition[] = [
  ...card('one', 0, 0, 'q0', oneLabel, 2, 0),
  ...card('two', 250, 0, 'q1', oneLabel, 2, 0),
  {
    data: {
      id: 'one-two',
      source: 'one',
      target: 'two',
      label: 'Edge from Node1 to Node2'
    }
  }
]

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

function App() {
  const [elements, setElements] = useState(initialState)
  const [editing, setEditing] = useState<EditingState | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const onSubmitForm = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (editing) {
      const spikeValue = parseInt(editing.spike, 10)
      const spikeLabel = isNaN(spikeValue) ? 0 : spikeValue

      if (editing.id != null) {
        const id = editing.id
        const rules = elements.find(el => el.data.id === `${id}-rules`)
        const spike = elements.find(el => el.data.id === `${id}-spike`)

        if (rules) {
          rules.data.label = editing.rules
        }
        if (spike) {
          spike.data.label = spikeLabel
        }
      } else {
        // create a new node
        const id = `q${qId++}`
        setElements(elms => [
          ...elements,
          ...card(
            id,
            editing.position.x,
            editing.position.y,
            id,
            editing.rules,
            spikeLabel,
            0
          )
        ])
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
    setElements(elements => elements.filter(el => el.data.rootId !== id))
  }
  const onDeleteEdge = (id: string) => {
    setElements(elements => elements.filter(el => el.data.id !== id))
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
    setElements([
      ...elements,
      ...createOutput(id, evt.position.x, evt.position.y, id, 12)
    ])
  }
  const onEdgeCreate = (
    src: cytoscapejs.NodeSingular,
    dst: cytoscapejs.NodeSingular,
    addedEles: cytoscapejs.EdgeCollection
  ) => {
    setElements([
      ...elements,
      ...(addedEles.jsons() as any).map((a: any) => ({ data: a.data }))
    ])
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
              cbsRef.current.onDeleteEdge(ele.id())
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
  width: '100%';
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

export default App
