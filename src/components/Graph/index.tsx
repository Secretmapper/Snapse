import React, { useEffect, useRef } from 'react'
import cytoscapejs from 'cytoscape'
import Cytoscape from 'react-cytoscapejs'
import useAnimateEdges from './useAnimateEdges'

type IGraph = {
  elements: cytoscapejs.ElementDefinition[]
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
      elements={props.elements}
      style={{ width: '100%', height: '100%' }}
      stylesheet={stylesheet}
    />
  )
}

const stylesheet: cytoscapejs.Stylesheet[] = [
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
      content: 'data(label)',
      'text-halign': 'center',
      'text-valign': 'center',
      events: 'no',
      height: 12,
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
      width: '1'
    }
  }
]

export default Graph
