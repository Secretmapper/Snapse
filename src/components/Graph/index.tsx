import React, { useEffect, useRef } from 'react'
import cytoscapejs from 'cytoscape'
import Cytoscape from 'react-cytoscapejs'
import useAnimateEdges from './useAnimateEdges'
import classList from '../../utils/classList'

type IGraph = {
  elements: cytoscapejs.ElementDefinition[]
  editing: { id?: string } | null
  onTap?: (evt: cytoscapejs.EventObject) => void
  onEdgeCreate?: (
    src: cytoscapejs.NodeSingular,
    dst: cytoscapejs.NodeSingular,
    addedEles: cytoscapejs.EdgeCollection
  ) => void
  cxtMenus: CxtMenu[]
}
type CxtMenu = any

function Graph(props: IGraph) {
  const [cyRef, setCy] = useAnimateEdges()
  const cyCBs = useRef<any>()

  const editingRef = useRef(props.editing)

  let elements = props.elements
  if (
    editingRef.current !== props.editing ||
    (editingRef.current &&
      props.editing &&
      editingRef.current.id !== props.editing.id)
  ) {
    elements = elements.map(item => {
      if (props && props.editing) {
        if (props.editing.id === item.data.id) {
          item = {
            ...item,
            classes: classList.add(item.classes || '', 'node--editing')
          }
        } else {
          item = {
            ...item,
            classes: classList.remove(item.classes || '', 'node--editing')
          }
        }
      }
      return item
    })
  }

  cyCBs.current = { onTap: props.onTap, onEdgeCreate: props.onEdgeCreate }
  useEffect(() => {
    const cy = cyRef.current

    const onTap = (evt: cytoscapejs.EventObject) => {
      if (cyCBs.current.onTap) {
        cyCBs.current.onTap(evt)
      }
    }
    const onEdgeCreate: IGraph['onEdgeCreate'] = (src, dst, eles) => {
      if (cyCBs.current.onEdgeCreate) {
        cyCBs.current.onEdgeCreate(src, dst, eles)
      }
    }
    if (cy) {
      cy.on('tap', onTap)

      // TODO: edgehandles is not generalized
      cy.edgehandles({
        handleNodes: '.snapse-node',
        preview: false,
        loopAllowed: () => true,
        edgeType: function (sourceNode, targetNode) {
          return sourceNode.edgesTo(targetNode).empty() ? 'flat' : undefined
        },
        complete: onEdgeCreate
      })
    }
  }, [cyRef])
  useEffect(() => {
    const cy = cyRef.current
    if (cy) {
      // TODO: cxtMenus is not updated for prop
      props.cxtMenus.map(cxtMenu => (cy as any).cxtmenu(cxtMenu))
    }
  }, [cyRef, props.cxtMenus])

  return (
    <Cytoscape
      cy={setCy}
      elements={elements}
      style={{ width: '100%', height: '100%' }}
      stylesheet={stylesheet}
    />
  )
}

const stylesheet: cytoscapejs.Stylesheet[] = [
  {
    selector: '.node--editing',
    style: {
      opacity: 0
    }
  },
  {
    selector: '.snapse-node, .snapse-output',
    style: {
      'background-opacity': '0' as any,
      'padding-top': '0',
      'border-width': 0,
      'text-halign': 'left',
      'text-valign': 'top',
      color: 'black',
      content: 'data(label)'
    }
  },
  {
    selector: '.snapse-node__rules, .snapse-node__output',
    style: {
      'background-color': 'white',
      'border-width': 1,
      events: 'no',
      'text-wrap': 'wrap',
      'text-halign': 'center',
      'text-valign': 'center',
      content: 'data(label)',
      height: 150,
      shape: 'roundrectangle',
      width: 100
    }
  },
  {
    selector: '.snapse-node__rules--invalid',
    style: {
      'background-color': '#ffbbbb',
      'border-color': '#ff4e4d'
    }
  },
  {
    selector: '.snapse-node__output',
    style: {
      height: 50,
      width: 150
    }
  },
  {
    selector: '.snapse-node__time, .snapse-node__spike',
    style: {
      'background-opacity': '0' as any,
      'text-halign': 'center',
      'text-valign': 'center',
      content: 'data(label)',
      events: 'no',
      height: 15,
      shape: 'roundrectangle',
      width: 50
    }
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'text-background-color': 'white',
      'text-background-shape': 'rectangle',
      width: 1
    }
  },
  {
    selector: '.node--value-increase, .node--value-decrease',
    style: {
      'transition-property': 'background-opacity',
      'transition-duration': '0.5s' as any
    }
  },
  {
    selector: '.node--value-increase',
    style: {
      'background-color': '#A4DE02',
      'background-opacity': 1,
      content: ele => '▲' + ele.data('label')
    }
  },
  {
    selector: '.node--value-decrease',
    style: {
      'background-color': '#E0371F',
      'background-opacity': 1,
      color: 'white',
      content: ele => '▼' + ele.data('label')
    }
  },
  {
    selector: '.node--triggering',
    style: {}
  },
  {
    selector: '.edge--triggering',
    style: {
      'line-color': 'darkgreen',
      'line-style': 'dashed',
      'target-arrow-color': 'darkgreen',
      width: 3
    }
  }
]

export default Graph
