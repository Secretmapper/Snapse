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
  ...card('one', 0, 0, 'q0', oneLabel, 12, 12),
  ...card('two', 250, 0, 'q1', oneLabel, 12, 12),
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
  value: string
}

function App() {
  const [elements, setElements] = useState(initialState)
  const [editing, setEditing] = useState<EditingState | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const onSubmitForm = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    inputRef.current?.blur()
  }
  const onInputBlur = () => {
    if (editing) {
      const id = `q${qId++}`
      setElements([
        ...elements,
        ...card(
          id,
          editing.position.x,
          editing.position.y,
          id,
          editing.value,
          12,
          12
        )
      ])
      setEditing(null)
    }
  }
  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setEditing(ed => (ed ? { ...ed, value } : null))
  }
  const onEditNode = (id: string) => {}
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
      value: ''
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
            select: function (ele: cytoscapejs.NodeSingular) {
              cbsRef.current.onEditNode(ele.id())
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
            <Input
              autoFocus
              ref={inputRef}
              onBlur={onInputBlur}
              value={editing?.value}
              onChange={onInputChange}
            />
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

const Input = styled.textarea`
  background-color: rgba(244, 244, 244, 1);
  height: 150px;
  margin: 2px;
  outline-width: thin;
  text-align: center;
  width: 100px;
`

export default App
