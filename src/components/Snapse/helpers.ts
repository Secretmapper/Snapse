import cytoscapejs from 'cytoscape'

export const createNeuron = (
  id: string,
  x: number,
  y: number,
  label: string,
  rules: string,
  spike: number,
  time: number,
  classes: string = ''
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
    position: { x, y: y + 60 }
  },
  {
    data: { rootId: id, id: `${id}-time`, parent: id, label: time },
    classes: 'snapse-node__time',
    position: { x, y: y + 90 }
  }
]

export const createOutput = (
  id: string,
  x: number,
  y: number,
  label: string,
  output: string,
  spike: number
): cytoscapejs.ElementDefinition[] => [
  {
    data: { rootId: id, id: `${id}`, label },
    classes: 'snapse-output',
    position: { x: 0, y: 0 }
  },
  {
    data: { rootId: id, id: `${id}-output`, parent: id, label: output },
    classes: 'snapse-node__output',
    position: { x, y: y }
  },
  {
    data: { rootId: id, id: `${id}-spike`, parent: id, label: spike },
    classes: 'snapse-node__spike',
    position: { x, y: y + 40 }
  }
]

export const createEdge = (source: string, target: string) => [
  {
    data: {
      id: `${source}-${target}`,
      source,
      target
    },
    classes: ''
  }
]
